import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

class StatusHero extends StatelessWidget {
  const StatusHero({
    required this.status,
    required this.badgeLabel,
    required this.badgeVariant,
    required this.currentStep,
    super.key,
  });

  final String status;
  final String badgeLabel;
  final AppStatusVariant badgeVariant;
  final int currentStep;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Current Status',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textLight,
                      letterSpacing: 0.1,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    status,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                    ),
                  ),
                ],
              ),
              // Using AppStatusBadge instead of AppBadge if available,
              // but I'll use a local version or the available one.
              _StatusBadge(label: badgeLabel, status: status),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          AppStepper(
            totalSteps: 4,
            currentStep: currentStep,
            stepLabels: const ['Received', 'Confirm', 'Shipping', 'Done'],
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.label, required this.status});
  final String label;
  final String status;

  @override
  Widget build(BuildContext context) {
    final isShipping = status.contains('🚚');
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: isShipping ? const Color(0xFFFEF3C7) : AppColors.softOrangeLight,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w800,
          color: isShipping ? const Color(0xFFF59E0B) : AppColors.softOrange,
        ),
      ),
    );
  }
}

class ShippingBanner extends StatelessWidget {
  const ShippingBanner({this.onDone, super.key});

  final VoidCallback? onDone;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFDCFCE7), Color(0xFFBBF7D0)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF86EFAC), width: 2),
      ),
      child: Row(
        children: [
          const Text('🎉', style: TextStyle(fontSize: 32)),
          const SizedBox(width: AppSpacing.md),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Package delivered?',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF15803D),
                  ),
                ),
                Text(
                  'Tap to mark as complete',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF16A34A),
                  ),
                ),
              ],
            ),
          ),
          AppButton(
            text: 'Done ✓',
            onPressed: onDone ?? () {},
            variant: AppButtonVariant.primary, // Note: Design has custom green
          ),
        ],
      ),
    );
  }
}

class StatusUpdateGrid extends StatelessWidget {
  const StatusUpdateGrid({required this.onUpdate, super.key});
  final VoidCallback onUpdate;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.5,
      children: [
        _StatusUpdateBtn(
          icon: '✅',
          label: 'Confirm Order',
          mmLabel: 'အတည်ပြုမည်',
          color: AppColors.teal,
          bgColor: AppColors.tealLight,
          onTap: onUpdate,
        ),
        _StatusUpdateBtn(
          icon: '🚚',
          label: 'Out for Delivery',
          mmLabel: 'ပို့ဆောင်နေသည်',
          color: Colors.orange,
          bgColor: const Color(0xFFFEF3C7),
          onTap: onUpdate,
        ),
        _StatusUpdateBtn(
          icon: '🎉',
          label: 'Mark Delivered',
          mmLabel: 'ရောက်ပြီ',
          color: Colors.green,
          bgColor: const Color(0xFFDCFCE7),
          onTap: onUpdate,
        ),
        _StatusUpdateBtn(
          icon: '✗',
          label: 'Cancel Order',
          mmLabel: 'ပယ်ဖျက်မည်',
          color: Colors.red,
          bgColor: const Color(0xFFFEE2E2),
          onTap: onUpdate,
        ),
      ],
    );
  }
}

class _StatusUpdateBtn extends StatelessWidget {
  const _StatusUpdateBtn({
    required this.icon,
    required this.label,
    required this.mmLabel,
    required this.color,
    required this.bgColor,
    required this.onTap,
  });

  final String icon;
  final String label;
  final String mmLabel;
  final Color color;
  final Color bgColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: AppColors.border, width: 2),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(icon, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            Text(
              mmLabel,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textLight,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CustomerInfoCard extends StatelessWidget {
  const CustomerInfoCard({super.key});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.softOrangeLight,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Center(child: Text('👤')),
              ),
              const SizedBox(width: AppSpacing.sm),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Customer Info',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    'ဖောက်သည်အချက်အလက်',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const _InfoRow(label: '👤 Name', value: 'Daw Khin Myat'),
          const _InfoRow(
            label: '📞 Phone',
            value: '09 7812 3456',
            valueColor: AppColors.teal,
          ),
          const _InfoRow(
            label: '🏠 Address',
            value: 'No. 45, Bo Gyoke St, Sanchaung, Yangon',
            isMultiline: true,
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  text: 'Call',
                  onPressed: () {},
                  variant: AppButtonVariant.secondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppButton(
                  text: 'Message',
                  onPressed: () {},
                  variant: AppButtonVariant.secondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppButton(
                  text: 'Map',
                  onPressed: () {},
                  variant: AppButtonVariant.secondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class ProductPaymentCard extends StatelessWidget {
  const ProductPaymentCard({super.key});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.tealLight,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Center(child: Text('📦')),
              ),
              const SizedBox(width: AppSpacing.sm),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Product & Payment',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    'ပစ္စည်းနှင့် ငွေပေးချေမှု',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const _InfoRow(
            label: '🛍️ Product',
            value: 'Silk Longyi Set (Green, M)',
          ),
          const _InfoRow(label: '🔢 Quantity', value: '× 2 pcs'),
          const _InfoRow(label: '💰 Unit Price', value: '18,000 MMK'),
          const _InfoRow(label: '🚚 Delivery', value: '3,000 MMK'),
          const SizedBox(height: 4),
          const _InfoRow(label: 'TOTAL', value: '39,000 MMK', isTotal: true),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.isMultiline = false,
    this.isTotal = false,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final bool isMultiline;
  final bool isTotal;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: isMultiline
            ? CrossAxisAlignment.start
            : CrossAxisAlignment.center,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: isTotal ? 12 : 11,
              fontWeight: isTotal ? FontWeight.w900 : FontWeight.w800,
              color: isTotal ? AppColors.textDark : AppColors.textLight,
              letterSpacing: 0.05,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: isTotal ? 16 : 13,
                fontWeight: FontWeight.w800,
                color: isTotal
                    ? AppColors.softOrange
                    : (valueColor ?? AppColors.textDark),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ActivityLogCard extends StatelessWidget {
  const ActivityLogCard({super.key});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Center(child: Text('📋')),
              ),
              const SizedBox(width: AppSpacing.sm),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Activity Log',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    'လှုပ်ရှားမှု မှတ်တမ်း',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          const AppTimeline(
            items: [
              AppTimelineItem(
                time: '10:32 AM today',
                event: 'Order created',
                subtitle: 'Added manually from Messenger chat',
                color: AppTimelineColor.orange,
              ),
              AppTimelineItem(
                time: 'Waiting',
                event: 'Confirmation pending',
                color: AppTimelineColor.gray,
                isLast: true,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class OrderDetailsBottomBar extends StatelessWidget {
  const OrderDetailsBottomBar({
    required this.isOutForDelivery,
    required this.onPrimaryPressed,
    super.key,
  });

  final bool isOutForDelivery;
  final VoidCallback onPrimaryPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            AppButton(
              text: isOutForDelivery ? '✎ Edit' : '🗑 Delete',
              onPressed: () {},
              variant: AppButtonVariant.secondary,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: AppButton(
                text: isOutForDelivery ? '✓ Mark Delivered' : '✓ Confirm Order',
                onPressed: onPrimaryPressed,
                variant: AppButtonVariant.primary,
                // Custom green styling for "Mark Delivered" could be added here
              ),
            ),
          ],
        ),
      ),
    );
  }
}
