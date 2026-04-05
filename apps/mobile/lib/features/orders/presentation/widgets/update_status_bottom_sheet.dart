import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

/// A bottom sheet for selecting and updating the order status.
class UpdateStatusBottomSheet extends StatefulWidget {
  const UpdateStatusBottomSheet({required this.initialStatus, super.key});

  final AppStatusVariant initialStatus;

  @override
  State<UpdateStatusBottomSheet> createState() =>
      _UpdateStatusBottomSheetState();

  /// Helper to show the bottom sheet.
  static Future<AppStatusVariant?> show(
    BuildContext context,
    AppStatusVariant initialStatus,
  ) {
    return showModalBottomSheet<AppStatusVariant>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) =>
          UpdateStatusBottomSheet(initialStatus: initialStatus),
    );
  }
}

class _UpdateStatusBottomSheetState extends State<UpdateStatusBottomSheet> {
  late AppStatusVariant _selectedStatus;
  final _noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selectedStatus = widget.initialStatus;
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 8,
        bottom: 36 + bottomInset,
      ),
      decoration: const BoxDecoration(
        color: AppColors.warmWhite,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Update Order Status',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w900,
              color: AppColors.textDark,
            ),
          ),
          const Text(
            'အော်ဒါ အခြေအနေ ပြောင်းမည်',
            style: TextStyle(
              fontSize: 12,
              color: AppColors.textLight,
              fontWeight: FontWeight.w600,
              fontFamily: 'NotoSansMyanmar',
            ),
          ),
          const SizedBox(height: 20),

          // Options
          _StatusOption(
            variant: AppStatusVariant.newOrder,
            icon: '🆕',
            title: 'New Order',
            subtitle: 'အော်ဒါ အသစ်',
            isSelected: _selectedStatus == AppStatusVariant.newOrder,
            isCurrent: widget.initialStatus == AppStatusVariant.newOrder,
            onTap: () =>
                setState(() => _selectedStatus = AppStatusVariant.newOrder),
          ),
          _StatusOption(
            variant: AppStatusVariant.confirmed,
            icon: '✅',
            title: 'Confirmed',
            subtitle: 'အတည်ပြုပြီး',
            isSelected: _selectedStatus == AppStatusVariant.confirmed,
            isCurrent: widget.initialStatus == AppStatusVariant.confirmed,
            onTap: () =>
                setState(() => _selectedStatus = AppStatusVariant.confirmed),
          ),
          _StatusOption(
            variant: AppStatusVariant.shipping,
            icon: '🚚',
            title: 'Out for Delivery',
            subtitle: 'ပို့ဆောင်နေသည်',
            isSelected: _selectedStatus == AppStatusVariant.shipping,
            isCurrent: widget.initialStatus == AppStatusVariant.shipping,
            onTap: () =>
                setState(() => _selectedStatus = AppStatusVariant.shipping),
          ),
          _StatusOption(
            variant: AppStatusVariant.delivered,
            icon: '🎉',
            title: 'Delivered',
            subtitle: 'ပေးပို့ပြီးစီး',
            isSelected: _selectedStatus == AppStatusVariant.delivered,
            isCurrent: widget.initialStatus == AppStatusVariant.delivered,
            onTap: () =>
                setState(() => _selectedStatus = AppStatusVariant.delivered),
          ),
          _StatusOption(
            variant: AppStatusVariant.cancelled,
            icon: '✗',
            title: 'Cancelled',
            subtitle: 'ပယ်ဖျက်မည်',
            isSelected: _selectedStatus == AppStatusVariant.cancelled,
            isCurrent: widget.initialStatus == AppStatusVariant.cancelled,
            onTap: () =>
                setState(() => _selectedStatus = AppStatusVariant.cancelled),
          ),

          const SizedBox(height: 16),
          AppTextField(
            controller: _noteController,
            hintText: 'Add a note (optional)',
            prefixIcon: const Icon(
              Icons.edit_note_rounded,
              color: AppColors.textLight,
            ),
          ),
          const SizedBox(height: 16),
          AppButton(
            text: 'Apply Status — အတည်ပြုမည်',
            onPressed: () => Navigator.of(context).pop(_selectedStatus),
          ),
        ],
      ),
    );
  }
}

class _StatusOption extends StatelessWidget {
  const _StatusOption({
    required this.variant,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.isCurrent,
    required this.onTap,
  });

  final AppStatusVariant variant;
  final String icon;
  final String title;
  final String subtitle;
  final bool isSelected;
  final bool isCurrent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Color bgColor;
    Color iconBgColor;
    switch (variant) {
      case AppStatusVariant.newOrder:
        bgColor = AppColors.softOrangeLight;
        iconBgColor = AppColors.softOrangeLight;
        break;
      case AppStatusVariant.confirmed:
        bgColor = AppColors.tealLight;
        iconBgColor = AppColors.tealLight;
        break;
      case AppStatusVariant.shipping:
        bgColor = AppColors.yellowLight;
        iconBgColor = AppColors.yellowLight;
        break;
      case AppStatusVariant.delivered:
        bgColor = AppColors.greenLight;
        iconBgColor = AppColors.greenLight;
        break;
      case AppStatusVariant.cancelled:
        bgColor = const Color(0xFFFEE2E2);
        iconBgColor = const Color(0xFFFEE2E2);
        break;
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? bgColor : Colors.white,
          border: Border.all(
            color: isSelected ? _getColor(variant) : AppColors.border,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBgColor,
                borderRadius: BorderRadius.circular(14),
              ),
              alignment: Alignment.center,
              child: Text(icon, style: const TextStyle(fontSize: 20)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isCurrent ? '$title (Current)' : title,
                    style: theme.textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textMid,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'NotoSansMyanmar',
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle_rounded, color: _getColor(variant)),
          ],
        ),
      ),
    );
  }

  Color _getColor(AppStatusVariant v) {
    switch (v) {
      case AppStatusVariant.newOrder:
        return AppColors.softOrange;
      case AppStatusVariant.confirmed:
        return AppColors.teal;
      case AppStatusVariant.shipping:
        return AppColors.yellow;
      case AppStatusVariant.delivered:
        return AppColors.green;
      case AppStatusVariant.cancelled:
        return const Color(0xFFEF4444);
    }
  }
}
