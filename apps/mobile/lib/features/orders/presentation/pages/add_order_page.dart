import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import '../widgets/order_summary_preview.dart';

class AddOrderPage extends StatefulWidget {
  const AddOrderPage({super.key});

  @override
  State<AddOrderPage> createState() => _AddOrderPageState();
}

class _AddOrderPageState extends State<AddOrderPage> {
  final _customerNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _townshipController = TextEditingController();
  final _addressController = TextEditingController();
  final _productNameController = TextEditingController();
  final _qtyController = TextEditingController(text: '1');
  final _unitPriceController = TextEditingController();
  final _deliveryFeeController = TextEditingController();
  final _noteController = TextEditingController();

  String _selectedStatus = 'New';
  bool _isSuccess = false;

  void _onStatusTap(String status) {
    setState(() {
      _selectedStatus = status;
    });
  }

  void _onSaveOrder() {
    setState(() {
      _isSuccess = true;
    });
  }

  void _onClear() {
    setState(() {
      _customerNameController.clear();
      _phoneController.clear();
      _townshipController.clear();
      _addressController.clear();
      _productNameController.clear();
      _qtyController.text = '1';
      _unitPriceController.clear();
      _deliveryFeeController.clear();
      _noteController.clear();
      _selectedStatus = 'New';
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccess) {
      return _SuccessView(onClose: () => setState(() => _isSuccess = false));
    }

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
              'New Order',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppColors.textDark,
                fontWeight: FontWeight.w900,
              ),
            ),
            Text(
              'အော်ဒါသစ် ထည့်မည်',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppColors.textLight,
                fontWeight: FontWeight.w600,
                fontFamily: 'NotoSansMyanmar',
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: AppButton(
              text: 'Clear',
              onPressed: _onClear,
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
              children: [
                AppPasteHelper(
                  onTap: () {
                    // Demonstration of auto-fill state
                    setState(() {
                      _customerNameController.text = 'Daw Khin Myat';
                      _phoneController.text = '09 7812 3456';
                      _townshipController.text = 'Sanchaung';
                      _addressController.text =
                          'No. 45, Bo Gyoke St, Sanchaung Tsp, Yangon';
                    });
                  },
                ),
                const SizedBox(height: AppSpacing.md),

                // Customer Info Section
                const AppSectionHeader(
                  icon: Icon(Icons.person_outline_rounded),
                  title: 'Customer Info',
                  subtitle: 'ဖောက်သည်အချက်အလက်',
                ),
                AppTextField(
                  label: 'Customer Name *',
                  hintText: 'e.g. Daw Khin Myat',
                  prefixIcon: const Icon(Icons.person_rounded),
                  controller: _customerNameController,
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: AppTextField(
                        label: 'Phone *',
                        hintText: '09xxxxxxxx',
                        prefixIcon: const Icon(Icons.phone_rounded),
                        keyboardType: TextInputType.phone,
                        controller: _phoneController,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      flex: 1,
                      child: AppTextField(
                        label: 'Township',
                        hintText: 'Area',
                        prefixIcon: const Icon(Icons.location_on_rounded),
                        controller: _townshipController,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                AppTextField(
                  prefixIcon: const Icon(Icons.home_rounded),
                  controller: _addressController,
                  maxLines: 3,
                ),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: Divider(color: AppColors.border),
                ),

                // Product Section
                const AppSectionHeader(
                  icon: Icon(Icons.inventory_2_outlined),
                  title: 'Product & Price',
                  subtitle: 'ပစ္စည်းနှင့် ဈေးနှုန်း',
                  iconBackgroundColor: AppColors.tealLight,
                  iconColor: AppColors.teal,
                ),
                AppTextField(
                  label: 'Product Name *',
                  hintText: 'e.g. Silk Longyi Set (Green)',
                  prefixIcon: const Icon(Icons.shopping_bag_rounded),
                  controller: _productNameController,
                ),
                const SizedBox(height: AppSpacing.sm),
                const _SuggestChips(),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: AppTextField(
                        label: 'Qty *',
                        hintText: '1',
                        keyboardType: TextInputType.number,
                        controller: _qtyController,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      flex: 5,
                      child: AppTextField(
                        label: 'Unit Price (MMK) *',
                        hintText: '25,000',
                        prefixIcon: const Icon(Icons.payments_rounded),
                        keyboardType: TextInputType.number,
                        controller: _unitPriceController,
                        suffixIcon: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text(
                            'MMK',
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
                  label: 'Delivery Fee',
                  hintText: '3,000',
                  prefixIcon: const Icon(Icons.local_shipping_rounded),
                  keyboardType: TextInputType.number,
                  controller: _deliveryFeeController,
                  suffixIcon: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(
                      'MMK',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: AppColors.textLight,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: Divider(color: AppColors.border),
                ),

                // Summary Preview (Demonstration of Screen 2)
                if (_productNameController.text.isNotEmpty ||
                    _unitPriceController.text.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: OrderSummaryPreview(
                      productName: _productNameController.text.isEmpty
                          ? 'Product'
                          : _productNameController.text,
                      quantity: int.tryParse(_qtyController.text) ?? 1,
                      unitPrice:
                          double.tryParse(_unitPriceController.text) ?? 0,
                      deliveryFee:
                          double.tryParse(_deliveryFeeController.text) ?? 0,
                    ),
                  ),

                // Order Status Section
                const AppSectionHeader(
                  icon: Icon(Icons.push_pin_outlined),
                  title: 'Order Status',
                  subtitle: 'အော်ဒါအခြေအနေ',
                  iconBackgroundColor: AppColors.greenLight,
                  iconColor: AppColors.green,
                ),
                Row(
                  children: [
                    Expanded(
                      child: AppSelectionOption(
                        icon: const Icon(Icons.fiber_new_rounded),
                        label: 'New',
                        subtitle: 'အသစ်',
                        isSelected: _selectedStatus == 'New',
                        onTap: () => _onStatusTap('New'),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: AppSelectionOption(
                        icon: const Icon(Icons.check_circle_rounded),
                        label: 'Confirmed',
                        subtitle: 'အတည်ပြု',
                        isSelected: _selectedStatus == 'Confirmed',
                        onTap: () => _onStatusTap('Confirmed'),
                        selectedBorderColor: AppColors.teal,
                        selectedBackgroundColor: AppColors.tealLight,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: AppSelectionOption(
                        icon: const Icon(Icons.local_shipping_rounded),
                        label: 'Shipping',
                        subtitle: 'သွားပြီ',
                        isSelected: _selectedStatus == 'Shipping',
                        onTap: () => _onStatusTap('Shipping'),
                        selectedBorderColor: AppColors.green,
                        selectedBackgroundColor: AppColors.greenLight,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                AppTextField(
                  prefixIcon: const Icon(Icons.note_alt_rounded),
                  controller: _noteController,
                  maxLines: 2,
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
                    text: 'Draft',
                    onPressed: () {},
                    variant: AppButtonVariant.tertiary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: AppButton(
                      text: 'Save Order — သိမ်းမည် ✓',
                      onPressed: _onSaveOrder,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SuggestChips extends StatelessWidget {
  const _SuggestChips();

  @override
  Widget build(BuildContext context) {
    return const Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        AppChip(label: '👗 Longyi Set'),
        AppChip(label: '👔 Shirt'),
        AppChip(label: '👜 Handbag'),
        AppChip(label: '+ more'),
      ],
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({required this.onClose});

  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

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
              ).animate().scale(duration: 400.ms, curve: Curves.elasticOut),
              const SizedBox(height: AppSpacing.xl),
              Text(
                'Order Saved!',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'New order has been successfully created.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.textMid,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Text(
                'အော်ဒါအသစ်ကို သိမ်းဆည်းပြီးပါပြီ။',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.teal,
                  fontFamily: 'NotoSansMyanmar',
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
                        'ORDER #8842',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: AppColors.softOrange,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    const _SuccessRow(
                      label: 'Customer',
                      value: 'Daw Khin Myat',
                    ),
                    const _SuccessRow(
                      label: 'Product',
                      value: 'Silk Longyi Set',
                    ),
                    const _SuccessRow(label: 'Date', value: '05 Apr 2026'),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xl),
              Row(
                children: [
                  Expanded(
                    child: AppButton(
                      text: 'Menu',
                      onPressed: onClose,
                      variant: AppButtonVariant.secondary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: AppButton(
                      text: 'View Order',
                      onPressed: onClose,
                      // Note: AppButton doesn't support custom background color directly through variant
                      // But secondary or primary might suffice. For "green" we might need a custom variant if it's frequent.
                      // For now I'll use primary.
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
  const _SuccessRow({required this.label, required this.value});

  final String label;
  final String value;

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
          Text(
            value,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textDark,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
