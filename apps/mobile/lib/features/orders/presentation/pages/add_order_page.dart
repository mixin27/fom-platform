import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_bloc/flutter_bloc.dart";
import "package:fom_mobile/app/di/injection_container.dart";
import "package:fom_mobile/app/router/app_route_paths.dart";
import "package:go_router/go_router.dart";
import "package:intl/intl.dart";

import "../../domain/entities/order_entry_customer_draft.dart";
import "../../domain/entities/order_entry_draft.dart";
import "../../domain/entities/order_entry_item_draft.dart";
import "../../domain/entities/order_list_item.dart";
import "../../domain/entities/order_source.dart";
import "../../domain/entities/order_status.dart";
import "../../domain/entities/parsed_order_message.dart";
import "../bloc/order_entry_bloc.dart";
import "../bloc/order_entry_event.dart";
import "../bloc/order_entry_state.dart";
import "../widgets/order_summary_preview.dart";

class AddOrderPage extends StatelessWidget {
  const AddOrderPage({
    super.key,
    required this.initialShopId,
    required this.initialShopName,
  });

  final String initialShopId;
  final String initialShopName;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<OrderEntryBloc>(
      create: (_) => getIt<OrderEntryBloc>()
        ..add(
          OrderEntryStarted(shopId: initialShopId, shopName: initialShopName),
        ),
      child: const _AddOrderView(),
    );
  }
}

class _AddOrderView extends StatefulWidget {
  const _AddOrderView();

  @override
  State<_AddOrderView> createState() => _AddOrderViewState();
}

class _AddOrderViewState extends State<_AddOrderView> {
  final _customerNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _townshipController = TextEditingController();
  final _addressController = TextEditingController();
  final _productNameController = TextEditingController();
  final _qtyController = TextEditingController(text: "1");
  final _unitPriceController = TextEditingController();
  final _deliveryFeeController = TextEditingController();
  final _noteController = TextEditingController();

  OrderStatus _selectedStatus = OrderStatus.newOrder;
  bool _isPasteApplied = false;
  ParsedOrderCustomerMatch? _customerMatch;
  List<String> _parseWarnings = const <String>[];
  List<String> _parseUnparsedLines = const <String>[];
  List<OrderEntryItemDraft> _additionalParsedItems =
      const <OrderEntryItemDraft>[];

  @override
  void initState() {
    super.initState();
    _productNameController.addListener(_onPreviewInputChanged);
    _qtyController.addListener(_onPreviewInputChanged);
    _unitPriceController.addListener(_onPreviewInputChanged);
    _deliveryFeeController.addListener(_onPreviewInputChanged);
  }

  @override
  void dispose() {
    _productNameController.removeListener(_onPreviewInputChanged);
    _qtyController.removeListener(_onPreviewInputChanged);
    _unitPriceController.removeListener(_onPreviewInputChanged);
    _deliveryFeeController.removeListener(_onPreviewInputChanged);

    _customerNameController.dispose();
    _phoneController.dispose();
    _townshipController.dispose();
    _addressController.dispose();
    _productNameController.dispose();
    _qtyController.dispose();
    _unitPriceController.dispose();
    _deliveryFeeController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<OrderEntryBloc, OrderEntryState>(
      listenWhen: (previous, current) {
        return previous.parsedOrderMessage != current.parsedOrderMessage ||
            previous.errorMessage != current.errorMessage;
      },
      listener: (context, state) {
        final parsed = state.parsedOrderMessage;
        if (parsed != null) {
          _applyParsedResult(parsed);
        }

        final message = state.errorMessage;
        if ((message ?? "").trim().isNotEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message!),
              behavior: SnackBarBehavior.floating,
            ),
          );
          context.read<OrderEntryBloc>().add(const OrderEntryErrorDismissed());
        }
      },
      builder: (context, state) {
        if (state.isSuccess && state.createdOrder != null) {
          return _SuccessView(
            order: state.createdOrder!,
            onAddAnotherTap: _onAddAnother,
            onViewOrdersTap: () => context.go(AppRoutePaths.orders),
          );
        }

        final effectiveItems = _buildEffectiveItems();
        final showSummary = effectiveItems.isNotEmpty;
        final parsing = state.isParsing;
        final submitting = state.isSubmitting;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: AppColors.warmWhite,
            elevation: 0,
            leadingWidth: 70,
            leading: Center(
              child: AppIconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "New Order",
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textDark,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  "Manual entry or Messenger paste",
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textLight,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: AppSpacing.md),
                child: AppButton(
                  text: "Clear",
                  onPressed: parsing || submitting ? null : _onClear,
                  variant: AppButtonVariant.tertiary,
                ),
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1.5),
              child: Container(color: AppColors.border, height: 1.5),
            ),
          ),
          body: Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.md,
                  AppSpacing.md,
                  AppSpacing.md,
                  80 + AppSpacing.xl,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    AppPasteHelper(
                      onTap: parsing || submitting
                          ? () {}
                          : () => _onPasteFromMessengerTap(context),
                      title: parsing
                          ? "Parsing message..."
                          : _isPasteApplied
                          ? "Fields auto-filled from message"
                          : "Paste from Messenger",
                      subtitle: parsing
                          ? "Extracting customer and order fields."
                          : _isPasteApplied
                          ? "Detected fields were applied. Review and save."
                          : "Copy customer message and parse fields automatically.",
                      isSuccessful: _isPasteApplied,
                    ),
                    if (state.parsedOrderMessage != null) ...[
                      const SizedBox(height: AppSpacing.md),
                      _ParseMetaCard(parsed: state.parsedOrderMessage!),
                    ],
                    if (_customerMatch != null) ...[
                      const SizedBox(height: AppSpacing.md),
                      AppAlertBanner(
                        title: "Matched existing customer",
                        message:
                            "${_customerMatch!.name} (${_customerMatch!.phone})",
                        icon: const Icon(
                          Icons.person_search_rounded,
                          size: 20,
                          color: AppColors.teal,
                        ),
                        backgroundColor: AppColors.tealLight,
                        borderColor: const Color(0xFFBFEDE9),
                        titleColor: AppColors.teal,
                        messageColor: AppColors.textMid,
                      ),
                    ],
                    if (_parseWarnings.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.md),
                      AppAlertBanner(
                        title: "Parser warnings",
                        message: _parseWarnings.join(" "),
                      ),
                    ],
                    if (_parseUnparsedLines.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.md),
                      AppAlertBanner(
                        title: "Unparsed lines",
                        message: _parseUnparsedLines.join("  •  "),
                        icon: const Icon(
                          Icons.info_outline_rounded,
                          size: 20,
                          color: Color(0xFF0369A1),
                        ),
                        backgroundColor: const Color(0xFFE0F2FE),
                        borderColor: const Color(0xFFBAE6FD),
                        titleColor: const Color(0xFF0369A1),
                        messageColor: const Color(0xFF0C4A6E),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.md),
                    const AppSectionHeader(
                      icon: Icon(Icons.person_outline_rounded),
                      title: "Customer Info",
                      subtitle: "ဖောက်သည်အချက်အလက်",
                    ),
                    AppTextField(
                      label: "Customer Name *",
                      hintText: "e.g. Daw Khin Myat",
                      prefixIcon: const Icon(Icons.person_rounded),
                      controller: _customerNameController,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            label: "Phone *",
                            hintText: "09xxxxxxxx",
                            prefixIcon: const Icon(Icons.phone_rounded),
                            keyboardType: TextInputType.phone,
                            controller: _phoneController,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: AppTextField(
                            label: "Township",
                            hintText: "Area",
                            prefixIcon: const Icon(Icons.location_on_outlined),
                            controller: _townshipController,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppTextField(
                      label: "Delivery Address",
                      hintText: "No. 45, Bo Gyoke St, Sanchaung...",
                      prefixIcon: const Icon(Icons.home_outlined),
                      maxLines: 3,
                      controller: _addressController,
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                      child: Divider(color: AppColors.border),
                    ),
                    const AppSectionHeader(
                      icon: Icon(Icons.inventory_2_outlined),
                      title: "Product & Price",
                      subtitle: "ပစ္စည်းနှင့် ဈေးနှုန်း",
                      iconBackgroundColor: AppColors.tealLight,
                      iconColor: AppColors.teal,
                    ),
                    AppTextField(
                      label: "Product Name *",
                      hintText: "e.g. Silk Longyi Set",
                      prefixIcon: const Icon(Icons.shopping_bag_outlined),
                      controller: _productNameController,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    _SuggestChips(onSelected: _onSuggestProduct),
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: AppTextField(
                            label: "Qty *",
                            hintText: "1",
                            keyboardType: TextInputType.number,
                            controller: _qtyController,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          flex: 5,
                          child: AppTextField(
                            label: "Unit Price (MMK) *",
                            hintText: "25,000",
                            prefixIcon: const Icon(Icons.payments_outlined),
                            keyboardType: TextInputType.number,
                            controller: _unitPriceController,
                            suffixIcon: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Text(
                                "MMK",
                                style: Theme.of(context).textTheme.labelLarge
                                    ?.copyWith(
                                      color: AppColors.textLight,
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppTextField(
                      label: "Delivery Fee",
                      hintText: "3,000",
                      prefixIcon: const Icon(Icons.local_shipping_outlined),
                      keyboardType: TextInputType.number,
                      controller: _deliveryFeeController,
                      suffixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(
                          "MMK",
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(
                                color: AppColors.textLight,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: AppChip(
                        label: "Add item",
                        icon: const Icon(Icons.add_rounded, size: 16),
                        onTap: parsing || submitting
                            ? null
                            : () => _onAddItemTap(context),
                      ),
                    ),
                    if (_additionalParsedItems.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.md),
                      _AdditionalItemsPreview(
                        items: _additionalParsedItems,
                        onAddItem: parsing || submitting
                            ? null
                            : () => _onAddItemTap(context),
                        onRemoveAt: parsing || submitting
                            ? null
                            : _removeAdditionalItemAt,
                        onRemoveAll: parsing || submitting
                            ? null
                            : _clearAdditionalParsedItems,
                      ),
                    ],
                    if (showSummary) ...[
                      const SizedBox(height: AppSpacing.md),
                      OrderSummaryPreview(
                        items: effectiveItems,
                        deliveryFee: _parseMoney(_deliveryFeeController.text),
                      ),
                    ],
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                      child: Divider(color: AppColors.border),
                    ),
                    const AppSectionHeader(
                      icon: Icon(Icons.push_pin_outlined),
                      title: "Order Status",
                      subtitle: "အော်ဒါအခြေအနေ",
                      iconBackgroundColor: AppColors.greenLight,
                      iconColor: AppColors.green,
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: AppSelectionOption(
                            icon: const Icon(Icons.fiber_new_rounded),
                            label: "New",
                            isSelected: _selectedStatus == OrderStatus.newOrder,
                            onTap: () => _onStatusTap(OrderStatus.newOrder),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: AppSelectionOption(
                            icon: const Icon(Icons.check_circle_rounded),
                            label: "Confirmed",
                            isSelected:
                                _selectedStatus == OrderStatus.confirmed,
                            onTap: () => _onStatusTap(OrderStatus.confirmed),
                            selectedBorderColor: AppColors.teal,
                            selectedBackgroundColor: AppColors.tealLight,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: AppSelectionOption(
                            icon: const Icon(Icons.local_shipping_rounded),
                            label: "Shipping",
                            isSelected:
                                _selectedStatus == OrderStatus.outForDelivery,
                            onTap: () =>
                                _onStatusTap(OrderStatus.outForDelivery),
                            selectedBorderColor: AppColors.green,
                            selectedBackgroundColor: AppColors.greenLight,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    AppTextField(
                      label: "Note",
                      hintText: "Special request, color, size...",
                      prefixIcon: const Icon(Icons.note_alt_outlined),
                      maxLines: 2,
                      controller: _noteController,
                    ),
                  ],
                ),
              ),
              Align(
                alignment: Alignment.bottomCenter,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.md,
                    AppSpacing.md,
                    AppSpacing.md,
                    AppSpacing.lg,
                  ),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(
                      top: BorderSide(color: AppColors.border, width: 1.5),
                    ),
                  ),
                  child: Row(
                    children: [
                      AppButton(
                        text: "Draft",
                        onPressed: parsing || submitting
                            ? null
                            : () => _showDraftComingSoon(context),
                        variant: AppButtonVariant.secondary,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: AppButton(
                          text: "Save Order",
                          onPressed: parsing || submitting
                              ? null
                              : () => _onSaveOrder(context),
                          isLoading: submitting,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _onPreviewInputChanged() {
    if (!mounted) {
      return;
    }
    setState(() {});
  }

  void _onStatusTap(OrderStatus status) {
    setState(() {
      _selectedStatus = status;
    });
  }

  void _onSuggestProduct(String productName) {
    _productNameController.text = productName;
  }

  Future<void> _onAddItemTap(BuildContext context) async {
    final item = await showModalBottomSheet<OrderEntryItemDraft>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _OrderItemSheet(),
    );

    if (!mounted || item == null) {
      return;
    }

    setState(() {
      _additionalParsedItems = <OrderEntryItemDraft>[
        ..._additionalParsedItems,
        item,
      ];
    });
  }

  Future<void> _onPasteFromMessengerTap(BuildContext context) async {
    final message = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _PasteMessageSheet(),
    );

    if (!context.mounted || message == null || message.trim().isEmpty) {
      return;
    }

    context.read<OrderEntryBloc>().add(
      OrderEntryParseMessageRequested(message: message),
    );
  }

  void _applyParsedResult(ParsedOrderMessage parsed) {
    final suggested = parsed.suggestedOrder;
    final suggestedItems = suggested.items
        .where(
          (item) =>
              item.productName.trim().isNotEmpty &&
              item.quantity > 0 &&
              item.unitPrice > 0,
        )
        .toList(growable: false);

    setState(() {
      _isPasteApplied = true;
      _customerMatch = parsed.customerMatch;
      _parseWarnings = parsed.warnings;
      _parseUnparsedLines = parsed.unparsedLines;

      if (suggested.customer.name.trim().isNotEmpty) {
        _customerNameController.text = suggested.customer.name;
      }
      if (suggested.customer.phone.trim().isNotEmpty) {
        _phoneController.text = suggested.customer.phone;
      }
      if ((suggested.customer.township ?? "").trim().isNotEmpty) {
        _townshipController.text = suggested.customer.township!;
      }
      if ((suggested.customer.address ?? "").trim().isNotEmpty) {
        _addressController.text = suggested.customer.address!;
      }

      if (suggestedItems.isNotEmpty) {
        final first = suggestedItems.first;
        if (first.productName.trim().isNotEmpty) {
          _productNameController.text = first.productName;
        }
        if (first.quantity > 0) {
          _qtyController.text = first.quantity.toString();
        }
        if (first.unitPrice > 0) {
          _unitPriceController.text = first.unitPrice.toString();
        }
      }
      _additionalParsedItems = suggestedItems.length > 1
          ? suggestedItems.sublist(1)
          : const <OrderEntryItemDraft>[];

      if (suggested.deliveryFee > 0) {
        _deliveryFeeController.text = suggested.deliveryFee.toString();
      }
      if ((suggested.note ?? "").trim().isNotEmpty) {
        _noteController.text = suggested.note!;
      }
      _selectedStatus = suggested.status;
    });
  }

  void _onClear() {
    setState(() {
      _customerNameController.clear();
      _phoneController.clear();
      _townshipController.clear();
      _addressController.clear();
      _productNameController.clear();
      _qtyController.text = "1";
      _unitPriceController.clear();
      _deliveryFeeController.clear();
      _noteController.clear();
      _selectedStatus = OrderStatus.newOrder;
      _isPasteApplied = false;
      _customerMatch = null;
      _parseWarnings = const <String>[];
      _parseUnparsedLines = const <String>[];
      _additionalParsedItems = const <OrderEntryItemDraft>[];
    });

    context.read<OrderEntryBloc>().add(const OrderEntryCleared());
  }

  void _onAddAnother() {
    _onClear();
  }

  void _clearAdditionalParsedItems() {
    setState(() {
      _additionalParsedItems = const <OrderEntryItemDraft>[];
    });
  }

  void _removeAdditionalItemAt(int index) {
    if (index < 0 || index >= _additionalParsedItems.length) {
      return;
    }

    setState(() {
      _additionalParsedItems = List<OrderEntryItemDraft>.from(
        _additionalParsedItems,
      )..removeAt(index);
    });
  }

  void _onSaveOrder(BuildContext context) {
    final customerName = _customerNameController.text.trim();
    final phone = _phoneController.text.trim();
    final effectiveItems = _buildEffectiveItems();

    if (customerName.isEmpty) {
      _showValidationError(context, "Customer name is required.");
      return;
    }
    if (phone.isEmpty) {
      _showValidationError(context, "Phone number is required.");
      return;
    }
    if (_hasIncompletePrimaryItemInput()) {
      _showValidationError(
        context,
        "Complete the current item fields or clear them before saving.",
      );
      return;
    }
    if (effectiveItems.isEmpty) {
      _showValidationError(context, "Add at least one valid item.");
      return;
    }

    final draft = OrderEntryDraft(
      customer: OrderEntryCustomerDraft(
        name: customerName,
        phone: phone,
        township: _nullableText(_townshipController.text),
        address: _nullableText(_addressController.text),
      ),
      items: effectiveItems,
      status: _selectedStatus,
      source: _isPasteApplied ? OrderSource.messenger : OrderSource.manual,
      deliveryFee: _parseMoney(_deliveryFeeController.text),
      note: _nullableText(_noteController.text),
      currency: "MMK",
    );

    context.read<OrderEntryBloc>().add(OrderEntrySaveRequested(draft: draft));
  }

  List<OrderEntryItemDraft> _buildEffectiveItems() {
    final name = _productNameController.text.trim();
    final qty = _parseQty(_qtyController.text);
    final unitPrice = _parseMoney(_unitPriceController.text);

    final items = <OrderEntryItemDraft>[];
    if (name.isNotEmpty && qty > 0 && unitPrice > 0) {
      items.add(
        OrderEntryItemDraft(
          productName: name,
          quantity: qty,
          unitPrice: unitPrice,
        ),
      );
    }

    items.addAll(
      _additionalParsedItems.where(
        (item) =>
            item.productName.trim().isNotEmpty &&
            item.quantity > 0 &&
            item.unitPrice > 0,
      ),
    );
    return items;
  }

  bool _hasIncompletePrimaryItemInput() {
    final name = _productNameController.text.trim();
    final qty = _parseQty(_qtyController.text);
    final unitPrice = _parseMoney(_unitPriceController.text);
    final rawQty = _qtyController.text.trim();
    final hasAnyPrimaryInput =
        name.isNotEmpty ||
        unitPrice > 0 ||
        (rawQty.isNotEmpty && rawQty != "1");

    if (!hasAnyPrimaryInput) {
      return false;
    }

    return name.isEmpty || qty < 1 || unitPrice <= 0;
  }

  void _showValidationError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  void _showDraftComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Draft saving will be added soon."),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  String? _nullableText(String value) {
    final raw = value.trim();
    if (raw.isEmpty) {
      return null;
    }

    return raw;
  }

  int _parseQty(String value) {
    final digits = value.replaceAll(RegExp(r"[^0-9]"), "");
    if (digits.isEmpty) {
      return 0;
    }
    return int.tryParse(digits) ?? 0;
  }

  int _parseMoney(String value) {
    final digits = value.replaceAll(RegExp(r"[^0-9]"), "");
    if (digits.isEmpty) {
      return 0;
    }
    return int.tryParse(digits) ?? 0;
  }
}

class _SuggestChips extends StatelessWidget {
  const _SuggestChips({required this.onSelected});

  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final labels = <String>["Longyi Set", "Shirt", "Handbag", "Shoes"];

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: labels
          .map((label) => AppChip(label: label, onTap: () => onSelected(label)))
          .toList(growable: false),
    );
  }
}

class _ParseMetaCard extends StatelessWidget {
  const _ParseMetaCard({required this.parsed});

  final ParsedOrderMessage parsed;

  @override
  Widget build(BuildContext context) {
    final confidencePercent = (parsed.confidence * 100).clamp(0, 100).round();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.psychology_alt_outlined, size: 18),
              const SizedBox(width: 8),
              Text(
                "Parser result",
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: AppColors.textDark,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Spacer(),
              Text(
                "$confidencePercent%",
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: parsed.isReadyToCreate
                      ? AppColors.green
                      : AppColors.softOrange,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          if (parsed.matchedFields.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: parsed.matchedFields
                  .map((field) => AppChip(label: field.replaceAll("_", " ")))
                  .toList(growable: false),
            ),
          ],
        ],
      ),
    );
  }
}

class _AdditionalItemsPreview extends StatelessWidget {
  const _AdditionalItemsPreview({
    required this.items,
    this.onAddItem,
    this.onRemoveAt,
    this.onRemoveAll,
  });

  final List<OrderEntryItemDraft> items;
  final VoidCallback? onAddItem;
  final ValueChanged<int>? onRemoveAt;
  final VoidCallback? onRemoveAll;

  @override
  Widget build(BuildContext context) {
    final numberFormat = NumberFormat.decimalPattern();

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  "Additional items",
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: AppColors.textMid,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              if (onAddItem != null)
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: AppChip(
                    label: "Add",
                    icon: const Icon(Icons.add_rounded, size: 14),
                    onTap: onAddItem!,
                  ),
                ),
              if (onRemoveAll != null)
                AppChip(label: "Remove extras", onTap: onRemoveAll!),
            ],
          ),
          const SizedBox(height: 8),
          ...items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.warmWhite,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.productName,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: AppColors.textDark,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            "Qty ${item.quantity} · ${numberFormat.format(item.unitPrice)} MMK",
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: AppColors.textMid,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "${numberFormat.format(item.lineTotal)} MMK",
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppColors.textMid,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        if (onRemoveAt != null) ...[
                          const SizedBox(height: 4),
                          AppChip(
                            label: "Remove",
                            icon: const Icon(Icons.close_rounded, size: 14),
                            onTap: () => onRemoveAt!(index),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({
    required this.order,
    required this.onAddAnotherTap,
    required this.onViewOrdersTap,
  });

  final OrderListItem order;
  final VoidCallback onAddAnotherTap;
  final VoidCallback onViewOrdersTap;

  @override
  Widget build(BuildContext context) {
    final numberFormat = NumberFormat.decimalPattern();
    return Scaffold(
      backgroundColor: AppColors.warmWhite,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: const BoxDecoration(
                  color: AppColors.greenLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: AppColors.green,
                  size: 48,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Text(
                "Order Saved!",
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                "Order added to your list. Update status as you go.",
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textMid,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: AppColors.border, width: 2),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.softOrangeLight,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        order.orderNo,
                        style: Theme.of(context).textTheme.labelMedium
                            ?.copyWith(
                              color: AppColors.softOrange,
                              fontWeight: FontWeight.w900,
                            ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    _SuccessRow(label: "Customer", value: order.customerName),
                    _SuccessRow(label: "Phone", value: order.customerPhone),
                    _SuccessRow(
                      label: "Product",
                      value: order.primaryProductSummary,
                    ),
                    _SuccessRow(
                      label: "Total",
                      value:
                          "${numberFormat.format(order.totalPrice)} ${order.currency}",
                    ),
                    _SuccessRow(
                      label: "Status",
                      trailing: AppStatusBadge(
                        variant: _statusVariantFromOrder(order.status),
                      ),
                    ),
                    _SuccessRow(
                      label: "Date",
                      value: DateFormat("dd MMM yyyy").format(order.createdAt),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Row(
                children: [
                  Expanded(
                    child: AppButton(
                      text: "Add Another",
                      onPressed: onAddAnotherTap,
                      variant: AppButtonVariant.secondary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: AppButton(
                      text: "View Orders",
                      onPressed: onViewOrdersTap,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SuccessRow extends StatelessWidget {
  const _SuccessRow({required this.label, this.value, this.trailing})
    : assert(
        (value == null && trailing != null) ||
            (value != null && trailing == null),
      );

  final String label;
  final String? value;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textLight,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Align(
              alignment: Alignment.centerRight,
              child:
                  trailing ??
                  Text(
                    value!,
                    textAlign: TextAlign.right,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textDark,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

AppStatusVariant _statusVariantFromOrder(OrderStatus status) {
  switch (status) {
    case OrderStatus.newOrder:
      return AppStatusVariant.newOrder;
    case OrderStatus.confirmed:
      return AppStatusVariant.confirmed;
    case OrderStatus.outForDelivery:
      return AppStatusVariant.shipping;
    case OrderStatus.delivered:
      return AppStatusVariant.delivered;
    case OrderStatus.cancelled:
      return AppStatusVariant.cancelled;
  }
}

class _PasteMessageSheet extends StatefulWidget {
  const _PasteMessageSheet();

  @override
  State<_PasteMessageSheet> createState() => _PasteMessageSheetState();
}

class _PasteMessageSheetState extends State<_PasteMessageSheet> {
  late final TextEditingController _controller;

  bool get _canSubmit => _controller.text.trim().length >= 5;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController()..addListener(_onTextChanged);
  }

  @override
  void dispose() {
    _controller
      ..removeListener(_onTextChanged)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottomInset),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              "Paste Messenger Message",
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              "Paste customer text to extract order fields.",
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textMid,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: _controller,
              label: "Message",
              hintText:
                  "Name: ...\nPhone: ...\nAddress: ...\nProduct: ...\nQty: ...",
              maxLines: 8,
              textInputAction: TextInputAction.newline,
              prefixIcon: const Icon(Icons.chat_outlined),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: AppButton(
                text: "Paste Clipboard",
                onPressed: _onPasteFromClipboard,
                variant: AppButtonVariant.tertiary,
                icon: const Icon(Icons.content_paste_rounded, size: 18),
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    text: "Cancel",
                    onPressed: () => Navigator.of(context).pop(),
                    variant: AppButtonVariant.secondary,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: AppButton(
                    text: "Parse",
                    onPressed: _canSubmit
                        ? () =>
                              Navigator.of(context).pop(_controller.text.trim())
                        : null,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _onTextChanged() {
    if (!mounted) {
      return;
    }

    setState(() {});
  }

  Future<void> _onPasteFromClipboard() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    final text = data?.text?.trim() ?? "";
    if (text.isEmpty) {
      return;
    }

    setState(() {
      _controller.text = text;
      _controller.selection = TextSelection.fromPosition(
        TextPosition(offset: _controller.text.length),
      );
    });
  }
}

class _OrderItemSheet extends StatefulWidget {
  const _OrderItemSheet();

  @override
  State<_OrderItemSheet> createState() => _OrderItemSheetState();
}

class _OrderItemSheetState extends State<_OrderItemSheet> {
  late final TextEditingController _productNameController;
  late final TextEditingController _qtyController;
  late final TextEditingController _unitPriceController;

  bool get _canSubmit {
    return _productNameController.text.trim().isNotEmpty &&
        _parseQty(_qtyController.text) > 0 &&
        _parseMoney(_unitPriceController.text) > 0;
  }

  @override
  void initState() {
    super.initState();
    _productNameController = TextEditingController()..addListener(_onChanged);
    _qtyController = TextEditingController(text: "1")..addListener(_onChanged);
    _unitPriceController = TextEditingController()..addListener(_onChanged);
  }

  @override
  void dispose() {
    _productNameController
      ..removeListener(_onChanged)
      ..dispose();
    _qtyController
      ..removeListener(_onChanged)
      ..dispose();
    _unitPriceController
      ..removeListener(_onChanged)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottomInset),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              "Add item",
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              "Add another product line to this order.",
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textMid,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            AppTextField(
              controller: _productNameController,
              label: "Product name",
              hintText: "e.g. Silk Longyi Set",
              prefixIcon: const Icon(Icons.shopping_bag_outlined),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: AppTextField(
                    controller: _qtyController,
                    label: "Qty",
                    hintText: "1",
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 5,
                  child: AppTextField(
                    controller: _unitPriceController,
                    label: "Unit price (MMK)",
                    hintText: "25000",
                    prefixIcon: const Icon(Icons.payments_outlined),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    text: "Cancel",
                    onPressed: () => Navigator.of(context).pop(),
                    variant: AppButtonVariant.secondary,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: AppButton(
                    text: "Add item",
                    onPressed: _canSubmit ? _submit : null,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _onChanged() {
    if (!mounted) {
      return;
    }

    setState(() {});
  }

  void _submit() {
    Navigator.of(context).pop(
      OrderEntryItemDraft(
        productName: _productNameController.text.trim(),
        quantity: _parseQty(_qtyController.text),
        unitPrice: _parseMoney(_unitPriceController.text),
      ),
    );
  }
}

int _parseQty(String value) {
  final digits = value.replaceAll(RegExp(r"[^0-9]"), "");
  if (digits.isEmpty) {
    return 0;
  }
  return int.tryParse(digits) ?? 0;
}

int _parseMoney(String value) {
  final digits = value.replaceAll(RegExp(r"[^0-9]"), "");
  if (digits.isEmpty) {
    return 0;
  }
  return int.tryParse(digits) ?? 0;
}
