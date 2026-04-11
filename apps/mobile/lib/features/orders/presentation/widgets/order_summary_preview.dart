import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:intl/intl.dart";

import "../../domain/entities/order_entry_item_draft.dart";

class OrderSummaryPreview extends StatelessWidget {
  const OrderSummaryPreview({
    required this.items,
    required this.deliveryFee,
    super.key,
  });

  final List<OrderEntryItemDraft> items;
  final int deliveryFee;

  int get subtotal {
    return items.fold<int>(0, (sum, item) => sum + item.lineTotal);
  }

  int get total => subtotal + deliveryFee;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final numberFormat = NumberFormat.decimalPattern();

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
            "Order Summary",
            style: theme.textTheme.labelMedium?.copyWith(
              color: AppColors.textLight,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.08,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          ...items.map(
            (item) => _PreviewRow(
              label: "${item.productName} x ${item.quantity}",
              value: "${numberFormat.format(item.lineTotal)} MMK",
            ),
          ),
          _PreviewRow(
            label: "Delivery Fee",
            value: "${numberFormat.format(deliveryFee)} MMK",
          ),
          const SizedBox(height: AppSpacing.xs),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Total",
                style: theme.textTheme.titleSmall?.copyWith(
                  color: AppColors.textDark,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                "${numberFormat.format(total)} MMK",
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
          Expanded(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textLight,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 8),
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
