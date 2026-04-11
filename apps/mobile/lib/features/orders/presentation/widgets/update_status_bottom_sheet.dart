import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";

import "../../domain/entities/order_status.dart";

class OrderStatusUpdateSelection {
  const OrderStatusUpdateSelection({required this.status, this.note});

  final OrderStatus status;
  final String? note;
}

class UpdateStatusBottomSheet extends StatefulWidget {
  const UpdateStatusBottomSheet({
    super.key,
    required this.initialStatus,
    this.allowedStatuses,
  });

  final OrderStatus initialStatus;
  final List<OrderStatus>? allowedStatuses;

  @override
  State<UpdateStatusBottomSheet> createState() =>
      _UpdateStatusBottomSheetState();

  static Future<OrderStatusUpdateSelection?> show(
    BuildContext context, {
    required OrderStatus initialStatus,
    List<OrderStatus>? allowedStatuses,
  }) {
    return showModalBottomSheet<OrderStatusUpdateSelection>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => UpdateStatusBottomSheet(
        initialStatus: initialStatus,
        allowedStatuses: allowedStatuses,
      ),
    );
  }
}

class _UpdateStatusBottomSheetState extends State<UpdateStatusBottomSheet> {
  late OrderStatus _selectedStatus;
  late final TextEditingController _noteController;

  List<OrderStatus> get _statuses {
    final configured = widget.allowedStatuses;
    if (configured != null && configured.isNotEmpty) {
      return configured;
    }

    return const <OrderStatus>[
      OrderStatus.newOrder,
      OrderStatus.confirmed,
      OrderStatus.outForDelivery,
      OrderStatus.delivered,
      OrderStatus.cancelled,
    ];
  }

  @override
  void initState() {
    super.initState();
    _selectedStatus = widget.initialStatus;
    _noteController = TextEditingController();
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      top: false,
      child: Container(
        padding: EdgeInsets.fromLTRB(20, 8, 20, 24 + bottomInset),
        decoration: const BoxDecoration(
          color: AppColors.warmWhite,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
            Text(
              "Update Order Status",
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              "အော်ဒါ အခြေအနေ ပြောင်းမည်",
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textLight,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            ..._statuses.map((status) {
              final selected = _selectedStatus == status;
              return _StatusOptionTile(
                title: _statusLabel(status),
                subtitle: _statusMmLabel(status),
                icon: _statusIcon(status),
                isSelected: selected,
                color: _statusColor(status),
                backgroundColor: _statusBackground(status),
                isCurrent: widget.initialStatus == status,
                onTap: () => setState(() {
                  _selectedStatus = status;
                }),
              );
            }),
            const SizedBox(height: 8),
            AppTextField(
              controller: _noteController,
              label: "Status Note",
              hintText: "Add a note (optional)",
              prefixIcon: const Icon(Icons.edit_note_rounded),
            ),
            const SizedBox(height: 12),
            AppButton(
              text: "Apply Status",
              onPressed: () {
                Navigator.of(context).pop(
                  OrderStatusUpdateSelection(
                    status: _selectedStatus,
                    note: _nullableText(_noteController.text),
                  ),
                );
              },
            ),
          ],
        ),
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
}

class _StatusOptionTile extends StatelessWidget {
  const _StatusOptionTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isSelected,
    required this.color,
    required this.backgroundColor,
    required this.isCurrent,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final bool isSelected;
  final Color color;
  final Color backgroundColor;
  final bool isCurrent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? backgroundColor : Colors.white,
          border: Border.all(
            color: isSelected ? color : AppColors.border,
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
                color: backgroundColor,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isCurrent ? "$title (Current)" : title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textMid,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.radio_button_checked_rounded, color: color, size: 18),
          ],
        ),
      ),
    );
  }
}

String _statusLabel(OrderStatus status) {
  switch (status) {
    case OrderStatus.newOrder:
      return "New";
    case OrderStatus.confirmed:
      return "Confirmed";
    case OrderStatus.outForDelivery:
      return "Out for Delivery";
    case OrderStatus.delivered:
      return "Delivered";
    case OrderStatus.cancelled:
      return "Cancelled";
  }
}

String _statusMmLabel(OrderStatus status) {
  switch (status) {
    case OrderStatus.newOrder:
      return "အသစ်";
    case OrderStatus.confirmed:
      return "အတည်ပြုပြီး";
    case OrderStatus.outForDelivery:
      return "ပို့ဆောင်နေသည်";
    case OrderStatus.delivered:
      return "ပေးပို့ပြီးစီး";
    case OrderStatus.cancelled:
      return "ပယ်ဖျက်မည်";
  }
}

IconData _statusIcon(OrderStatus status) {
  switch (status) {
    case OrderStatus.newOrder:
      return Icons.fiber_new_rounded;
    case OrderStatus.confirmed:
      return Icons.check_circle_rounded;
    case OrderStatus.outForDelivery:
      return Icons.local_shipping_rounded;
    case OrderStatus.delivered:
      return Icons.task_alt_rounded;
    case OrderStatus.cancelled:
      return Icons.cancel_rounded;
  }
}

Color _statusColor(OrderStatus status) {
  switch (status) {
    case OrderStatus.newOrder:
      return AppColors.softOrange;
    case OrderStatus.confirmed:
      return AppColors.teal;
    case OrderStatus.outForDelivery:
      return AppColors.yellow;
    case OrderStatus.delivered:
      return AppColors.green;
    case OrderStatus.cancelled:
      return const Color(0xFFEF4444);
  }
}

Color _statusBackground(OrderStatus status) {
  switch (status) {
    case OrderStatus.newOrder:
      return AppColors.softOrangeLight;
    case OrderStatus.confirmed:
      return AppColors.tealLight;
    case OrderStatus.outForDelivery:
      return AppColors.yellowLight;
    case OrderStatus.delivered:
      return AppColors.greenLight;
    case OrderStatus.cancelled:
      return const Color(0xFFFEE2E2);
  }
}
