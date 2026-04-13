import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:flutter_bloc/flutter_bloc.dart";
import "package:fom_mobile/app/di/injection_container.dart";
import "package:fom_mobile/app/router/app_route_paths.dart";
import "package:go_router/go_router.dart";
import "package:intl/intl.dart";
import "package:url_launcher/url_launcher.dart";

import "../../domain/entities/customer_draft.dart";
import "../../domain/entities/customer_list_item.dart";
import "../../domain/entities/customer_recent_order.dart";
import "../../domain/usecases/update_customer_use_case.dart";
import "../bloc/customer_profile_bloc.dart";
import "../bloc/customer_profile_event.dart";
import "../bloc/customer_profile_state.dart";
import "../widgets/customer_editor_sheet.dart";

class CustomerProfilePage extends StatelessWidget {
  const CustomerProfilePage({
    super.key,
    required this.customerId,
    required this.shopId,
    required this.shopName,
  });

  final String customerId;
  final String shopId;
  final String shopName;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<CustomerProfileBloc>(
      create: (_) => getIt<CustomerProfileBloc>()
        ..add(
          CustomerProfileStarted(
            shopId: shopId,
            shopName: shopName,
            customerId: customerId,
          ),
        ),
      child: const _CustomerProfileView(),
    );
  }
}

class _CustomerProfileView extends StatelessWidget {
  const _CustomerProfileView();

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CustomerProfileBloc, CustomerProfileState>(
      listenWhen: (previous, current) {
        return previous.errorMessage != current.errorMessage &&
            current.errorMessage != null;
      },
      listener: (context, state) {
        final message = state.errorMessage;
        if (message == null || message.isEmpty) {
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
        );
        context.read<CustomerProfileBloc>().add(
          const CustomerProfileErrorDismissed(),
        );
      },
      builder: (context, state) {
        final customer = state.customer;

        return Scaffold(
          backgroundColor: AppColors.background,
          body: RefreshIndicator(
            color: AppColors.softOrange,
            onRefresh: () => _onRefresh(context),
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: _buildHeader(context: context, customer: customer),
                ),
                if (state.status == CustomerProfileStatus.loading &&
                    customer == null)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (customer == null)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: AppEmptyState(
                      icon: Icon(Icons.person_off_outlined),
                      title: "Customer not found",
                      message: "This customer profile is unavailable.",
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        _buildQuickActions(context, customer),
                        _buildContactInfo(customer),
                        _buildSpendingSummary(customer),
                        _OrderHistoryCard(
                          customer: customer,
                          onSeeAllPressed: () =>
                              _openCustomerOrders(context, customer),
                          onOrderPressed: (order) => context.push(
                            AppRoutePaths.orderDetails.replaceFirst(
                              ':id',
                              order.id,
                            ),
                          ),
                        ),
                        const SizedBox(height: 40),
                      ]),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader({
    required BuildContext context,
    required CustomerListItem? customer,
  }) {
    final normalized = customer ?? _fallbackCustomer();
    final average = normalized.totalOrders == 0
        ? 0
        : (normalized.totalSpent / normalized.totalOrders).round();

    return AppCustomerProfileHeader(
      name: normalized.name,
      phone: normalized.phone,
      township: normalized.township,
      avatarUrl: normalized.avatarUrl,
      isVip: normalized.isVip,
      isLoyal: normalized.isLoyal,
      totalOrdersText: "${normalized.totalOrders}",
      totalSpentText: _formatCompactAmount(normalized.totalSpent),
      averageOrderText: _formatCompactAmount(average),
      deliveredRateText: "${normalized.deliveredRate}%",
      onBackPressed: () => Navigator.of(context).pop(),
      onMorePressed: customer == null
          ? null
          : () => _openEditCustomerSheet(context, customer),
    );
  }

  Widget _buildQuickActions(BuildContext context, CustomerListItem customer) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Expanded(
            child: _QuickActionChip(
              icon: Icons.call_outlined,
              label: "Call",
              onTap: () => _callCustomer(context, customer.phone),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _QuickActionChip(
              icon: Icons.message_outlined,
              label: "Message",
              onTap: () => _messageCustomer(context, customer.phone),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _QuickActionChip(
              icon: Icons.add_box_outlined,
              label: "New Order",
              borderColor: AppColors.softOrange,
              backgroundColor: AppColors.softOrangeLight,
              foregroundColor: AppColors.softOrange,
              onTap: () => context.push(AppRoutePaths.addOrder),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _QuickActionChip(
              icon: Icons.receipt_long_outlined,
              label: "Orders",
              onTap: () => _openCustomerOrders(context, customer),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactInfo(CustomerListItem customer) {
    return AppInfoRowsCard(
      icon: Icons.person_outline_rounded,
      iconBackgroundColor: AppColors.softOrangeLight,
      title: "Contact Info",
      rows: [
        AppInfoRowItem(
          keyLabel: "Phone",
          valueLabel: customer.phone,
          valueColor: AppColors.teal,
        ),
        AppInfoRowItem(
          keyLabel: "Township",
          valueLabel: customer.township?.trim().isNotEmpty == true
              ? customer.township!
              : "-",
        ),
        AppInfoRowItem(
          keyLabel: "Address",
          valueLabel: customer.address?.trim().isNotEmpty == true
              ? customer.address!
              : "-",
          valueColor: AppColors.textMid,
          valueFontSize: 11,
          valueFontWeight: FontWeight.w600,
        ),
        AppInfoRowItem(
          keyLabel: "Customer Since",
          valueLabel: DateFormat("MMM d, y").format(customer.createdAt),
        ),
      ],
    );
  }

  Widget _buildSpendingSummary(CustomerListItem customer) {
    return AppInfoRowsCard(
      icon: Icons.paid_outlined,
      iconBackgroundColor: AppColors.tealLight,
      title: "Spending Summary",
      rows: [
        AppInfoRowItem(
          keyLabel: "Total Spent",
          valueLabel:
              "${NumberFormat.decimalPattern().format(customer.totalSpent)} MMK",
          valueColor: AppColors.softOrange,
          valueFontSize: 15,
        ),
        AppInfoRowItem(
          keyLabel: "Largest Order",
          valueLabel:
              "${NumberFormat.decimalPattern().format(customer.largestOrderTotal)} MMK",
        ),
        AppInfoRowItem(
          keyLabel: "Favourite Item",
          valueLabel: customer.favouriteItem?.trim().isNotEmpty == true
              ? customer.favouriteItem!
              : "-",
        ),
        AppInfoRowItem(
          keyLabel: "Last Order",
          valueLabel: customer.lastOrderAt == null
              ? "-"
              : DateFormat("MMM d, y").format(customer.lastOrderAt!),
        ),
      ],
    );
  }

  Future<void> _onRefresh(BuildContext context) async {
    context.read<CustomerProfileBloc>().add(
      const CustomerProfileRefreshRequested(),
    );
    await Future<void>.delayed(const Duration(milliseconds: 800));
  }

  Future<void> _openEditCustomerSheet(
    BuildContext context,
    CustomerListItem customer,
  ) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => CustomerEditorSheet(
        title: 'Edit Customer',
        submitLabel: 'Save Changes',
        initialCustomer: customer,
        onSubmitted: (draft) async {
          final updateResult = await getIt<UpdateCustomerUseCase>().call(
            UpdateCustomerParams(
              shopId: customer.shopId,
              customerId: customer.id,
              draft: CustomerDraft(
                name: draft.name,
                phone: draft.phone,
                township: draft.township,
                address: draft.address,
                notes: draft.notes,
              ),
            ),
          );
          final failure = updateResult.failureOrNull;

          if (failure != null) {
            throw Exception(failure.message);
          }
        },
      ),
    );

    if (!context.mounted || result != true) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Customer updated successfully.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _openCustomerOrders(BuildContext context, CustomerListItem customer) {
    final path = Uri(
      path: AppRoutePaths.customerOrders.replaceFirst(':id', customer.id),
      queryParameters: <String, String>{
        'customer_name': customer.name,
        'customer_phone': customer.phone,
      },
    ).toString();

    context.push(path);
  }

  Future<void> _callCustomer(BuildContext context, String phone) async {
    final target = _normalizePhoneTarget(phone);
    if (target.isEmpty) {
      _showContactActionUnavailable(
        context,
        'Customer phone number is unavailable.',
      );
      return;
    }

    await _launchContactUri(
      context,
      Uri(scheme: 'tel', path: target),
      fallbackMessage: 'Unable to start a phone call right now.',
    );
  }

  Future<void> _messageCustomer(BuildContext context, String phone) async {
    final target = _normalizePhoneTarget(phone);
    if (target.isEmpty) {
      _showContactActionUnavailable(
        context,
        'Customer phone number is unavailable.',
      );
      return;
    }

    await _launchContactUri(
      context,
      Uri(scheme: 'sms', path: target),
      fallbackMessage: 'Unable to open the messaging app right now.',
    );
  }

  Future<void> _launchContactUri(
    BuildContext context,
    Uri uri, {
    required String fallbackMessage,
  }) async {
    try {
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );

      if (launched || !context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(fallbackMessage),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (_) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(fallbackMessage),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  String _normalizePhoneTarget(String value) {
    final normalized = value.replaceAll(RegExp(r'[^0-9+]'), '');
    return normalized.isEmpty ? value.trim() : normalized;
  }

  void _showContactActionUnavailable(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  CustomerListItem _fallbackCustomer() {
    return CustomerListItem(
      id: "",
      shopId: "",
      name: "Customer",
      phone: "-",
      township: null,
      address: null,
      notes: null,
      avatarUrl: null,
      createdAt: DateTime.now(),
      totalOrders: 0,
      totalSpent: 0,
      lastOrderAt: null,
      deliveredRate: 0,
      isVip: false,
      isNewThisWeek: false,
      largestOrderTotal: 0,
      favouriteItem: null,
      recentOrders: const <CustomerRecentOrder>[],
      hasRecentOrders: false,
    );
  }

  String _formatCompactAmount(int amount) {
    if (amount.abs() >= 1000) {
      final compact = amount / 1000;
      final hasFraction = compact.truncateToDouble() != compact;
      return "${compact.toStringAsFixed(hasFraction ? 1 : 0)}K";
    }

    return NumberFormat.decimalPattern().format(amount);
  }
}

class _QuickActionChip extends StatelessWidget {
  const _QuickActionChip({
    required this.icon,
    required this.label,
    this.onTap,
    this.borderColor = AppColors.border,
    this.backgroundColor = Colors.white,
    this.foregroundColor = AppColors.textMid,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final Color borderColor;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: 2),
        ),
        child: Column(
          children: [
            Icon(icon, color: foregroundColor, size: 20),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: foregroundColor,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderHistoryCard extends StatelessWidget {
  const _OrderHistoryCard({
    required this.customer,
    required this.onSeeAllPressed,
    required this.onOrderPressed,
  });

  final CustomerListItem customer;
  final VoidCallback onSeeAllPressed;
  final ValueChanged<CustomerRecentOrder> onOrderPressed;

  @override
  Widget build(BuildContext context) {
    final orders = customer.recentOrders;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.purpleLight,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Icon(
                  Icons.receipt_long_outlined,
                  size: 16,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  "Order History",
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                    fontSize: 13,
                  ),
                ),
              ),
              InkWell(
                borderRadius: BorderRadius.circular(999),
                onTap: onSeeAllPressed,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 4,
                  ),
                  child: Text(
                    "See all (${customer.totalOrders})",
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.softOrange,
                      fontSize: 11,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (orders.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                "No recent orders available.",
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textLight,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )
          else
            ...orders.asMap().entries.map((entry) {
              final index = entry.key;
              final order = entry.value;
              final isLast = index == orders.length - 1;
              return _MiniOrderRow(
                order: order,
                isLast: isLast,
                onTap: () => onOrderPressed(order),
              );
            }),
        ],
      ),
    );
  }
}

class _MiniOrderRow extends StatelessWidget {
  const _MiniOrderRow({
    required this.order,
    required this.isLast,
    required this.onTap,
  });

  final CustomerRecentOrder order;
  final bool isLast;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.only(top: 10, bottom: isLast ? 0 : 10),
        decoration: BoxDecoration(
          border: isLast
              ? null
              : const Border(
                  bottom: BorderSide(color: AppColors.border, width: 1),
                ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "#${order.orderNo}",
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w700,
                      fontFamily: "Courier",
                      fontSize: 10,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    order.productName,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textDark,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    DateFormat("MMM d, h:mm a").format(order.createdAt),
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  NumberFormat.decimalPattern().format(order.totalPrice),
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppColors.textDark,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                AppStatusBadge(
                  variant: _variantForStatus(order.status),
                  label: order.statusLabel,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  AppStatusVariant _variantForStatus(String status) {
    final normalized = status.trim().toLowerCase();
    switch (normalized) {
      case "new_order":
        return AppStatusVariant.newOrder;
      case "confirmed":
        return AppStatusVariant.confirmed;
      case "out_for_delivery":
        return AppStatusVariant.shipping;
      case "delivered":
        return AppStatusVariant.delivered;
      case "cancelled":
        return AppStatusVariant.cancelled;
      default:
        return AppStatusVariant.newOrder;
    }
  }
}
