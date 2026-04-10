import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';
import 'app_status_badge.dart';

/// A detailed card for presenting orders in a list.
class AppOrderCard extends StatelessWidget {
  const AppOrderCard({
    required this.customerName,
    required this.orderId,
    required this.productName,
    required this.price,
    required this.status,
    required this.onTap,
    super.key,
    this.phone,
    this.township,
    this.time,
    this.customerAvatar,
    this.productIcon,
    this.productIconWidget,
    this.onPrimaryAction,
    this.primaryActionLabel,
    this.primaryActionIcon,
    this.onSecondaryAction,
    this.secondaryActionLabel,
    this.secondaryActionIcon,
    this.isActionLoading = false,
  });

  /// The customer's name.
  final String customerName;

  /// The unique order ID.
  final String orderId;

  /// The product name or summary.
  final String productName;

  /// The total price of the order.
  final String price;

  /// The current status of the order.
  final AppStatusVariant status;

  /// Callback when the card is tapped.
  final VoidCallback onTap;

  /// Optional phone number.
  final String? phone;

  /// Optional township/location.
  final String? township;

  /// Optional time of the order.
  final String? time;

  /// Optional widget for the customer's avatar.
  final Widget? customerAvatar;

  /// Optional legacy text icon for the product.
  final String? productIcon;

  /// Optional icon widget for product summary.
  final Widget? productIconWidget;

  /// Optional callback for a primary action button (e.g., "Confirm").
  final VoidCallback? onPrimaryAction;

  /// Optional label for the primary action button.
  final String? primaryActionLabel;
  final IconData? primaryActionIcon;

  /// Optional callback for a secondary action button (e.g., "Call").
  final VoidCallback? onSecondaryAction;

  /// Optional label for the secondary action button.
  final String? secondaryActionLabel;
  final IconData? secondaryActionIcon;
  final bool isActionLoading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Get color based on status for the left accent border.
    final accentColor = _getStatusColor(status);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: AppColors.textDark.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Colored status accent stripe.
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: accentColor,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top Row: Customer Info and Status Badge
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        customerAvatar ??
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: AppColors.softOrange.withValues(
                                  alpha: 0.1,
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.person_outline,
                                color: AppColors.softOrange,
                                size: 20,
                              ),
                            ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                customerName,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  color: AppColors.textDark,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              if (phone != null || township != null)
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.call_outlined,
                                      size: 12,
                                      color: AppColors.textLight,
                                    ),
                                    const SizedBox(width: 3),
                                    Expanded(
                                      child: Text(
                                        [
                                          if (phone != null) phone,
                                          if (township != null) township,
                                        ].join(' · '),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: theme.textTheme.labelSmall
                                            ?.copyWith(
                                              color: AppColors.textLight,
                                              fontWeight: FontWeight.w600,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                            ],
                          ),
                        ),
                        AppStatusBadge(variant: status),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Product and Price Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              _ProductIcon(
                                iconText: productIcon,
                                iconWidget: productIconWidget,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  productName,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: AppColors.textMid,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: price,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  color: AppColors.textDark,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              TextSpan(
                                text: ' MMK',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: AppColors.textLight,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(
                      height: 24,
                      thickness: 1,
                      color: AppColors.border,
                    ),
                    // Footer Row: Order ID, Time and Optional Actions
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              orderId,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: AppColors.textLight,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Courier', // Monospace for IDs
                                fontSize: 10,
                              ),
                            ),
                            if (time != null)
                              Text(
                                time!,
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: AppColors.textLight,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 10,
                                ),
                              ),
                          ],
                        ),
                        if (isActionLoading)
                          const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        else if (onPrimaryAction != null ||
                            onSecondaryAction != null)
                          Row(
                            children: [
                              if (onSecondaryAction != null)
                                Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: _ActionBtn(
                                    label: secondaryActionLabel ?? 'Call',
                                    onPressed: onSecondaryAction!,
                                    isPrimary: false,
                                    icon: secondaryActionIcon,
                                  ),
                                ),
                              if (onPrimaryAction != null)
                                _ActionBtn(
                                  label: primaryActionLabel ?? 'Confirm',
                                  onPressed: onPrimaryAction!,
                                  isPrimary: true,
                                  icon: primaryActionIcon,
                                ),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(AppStatusVariant status) {
    return switch (status) {
      AppStatusVariant.newOrder => AppColors.softOrange,
      AppStatusVariant.confirmed => AppColors.teal,
      AppStatusVariant.shipping => AppColors.yellow,
      AppStatusVariant.delivered => AppColors.green,
      AppStatusVariant.cancelled => const Color(0xFFEF4444),
    };
  }
}

class _ActionBtn extends StatelessWidget {
  const _ActionBtn({
    required this.label,
    required this.onPressed,
    this.isPrimary = true,
    this.icon,
  });

  final String label;
  final VoidCallback onPressed;
  final bool isPrimary;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isPrimary ? AppColors.softOrange : Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            border: isPrimary
                ? null
                : Border.all(color: AppColors.border, width: 1.5),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  size: 12,
                  color: isPrimary ? Colors.white : AppColors.textMid,
                ),
                const SizedBox(width: 4),
              ],
              Text(
                label,
                style: TextStyle(
                  color: isPrimary ? Colors.white : AppColors.textMid,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProductIcon extends StatelessWidget {
  const _ProductIcon({required this.iconText, required this.iconWidget});

  final String? iconText;
  final Widget? iconWidget;

  @override
  Widget build(BuildContext context) {
    if (iconWidget != null) {
      return IconTheme(
        data: const IconThemeData(size: 14, color: AppColors.textMid),
        child: iconWidget!,
      );
    }

    final legacyText = iconText?.trim() ?? '';
    if (legacyText.isNotEmpty) {
      return Text(legacyText, style: const TextStyle(fontSize: 14));
    }

    return const Icon(
      Icons.inventory_2_outlined,
      size: 14,
      color: AppColors.textMid,
    );
  }
}
