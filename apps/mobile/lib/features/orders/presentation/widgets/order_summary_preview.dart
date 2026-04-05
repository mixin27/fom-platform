import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

class OrderSummaryPreview extends StatelessWidget {
  const OrderSummaryPreview({
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.deliveryFee,
    super.key,
  });

  final String productName;
  final int quantity;
  final double unitPrice;
  final double deliveryFee;

  double get subtotal => unitPrice * quantity;
  double get total => subtotal + deliveryFee;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.border, width: 2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Order Summary — အော်ဒါ အကျဉ်း',
            style: theme.textTheme.labelMedium?.copyWith(
              color: AppColors.textLight,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.08,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _PreviewRow(
            label: '$productName × $quantity',
            value: '${subtotal.toStringAsFixed(0)} MMK',
          ),
          _PreviewRow(
            label: 'Delivery Fee',
            value: '${deliveryFee.toStringAsFixed(0)} MMK',
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total',
                style: theme.textTheme.titleSmall?.copyWith(
                  color: AppColors.textDark,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                '${total.toStringAsFixed(0)} MMK',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: AppColors.softOrange,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PreviewRow extends StatelessWidget {
  const _PreviewRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppColors.textLight,
              fontWeight: FontWeight.w700,
            ),
          ),
          Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppColors.textDark,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
