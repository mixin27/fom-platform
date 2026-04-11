import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:intl/intl.dart";

import "../../domain/entities/order_details.dart";
import "../../domain/entities/order_list_item.dart";
import "../../domain/entities/order_source.dart";
import "../../domain/entities/order_status.dart";
import "../../domain/entities/order_status_history_event.dart";

class OrderDetailsStatusHero extends StatelessWidget {
  const OrderDetailsStatusHero({
    super.key,
    required this.status,
    required this.currentStep,
  });

  final OrderStatus status;
  final int currentStep;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
      showShadow: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Current Status",
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.textLight,
                      letterSpacing: 0.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _statusHeading(status),
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                      fontSize: 22,
                    ),
                  ),
                ],
              ),
              AppStatusBadge(variant: _toBadgeVariant(status)),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          AppStepper(
            totalSteps: 4,
            currentStep: currentStep,
            stepLabels: const <String>[
              "Received",
              "Confirm",
              "Shipping",
              "Done",
            ],
          ),
        ],
      ),
    );
  }
}

class OrderDetailsShippingBanner extends StatelessWidget {
  const OrderDetailsShippingBanner({
    super.key,
    required this.onMarkDelivered,
    this.isLoading = false,
  });

  final VoidCallback onMarkDelivered;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: <Color>[Color(0xFFDCFCE7), Color(0xFFBBF7D0)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF86EFAC), width: 2),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.local_shipping_rounded,
              color: AppColors.green,
              size: 22,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Package delivered?",
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF15803D),
                  ),
                ),
                Text(
                  "Tap to mark as complete",
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF16A34A),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 96,
            child: AppButton(
              text: "Done",
              onPressed: isLoading ? null : onMarkDelivered,
              isLoading: isLoading,
            ),
          ),
        ],
      ),
    );
  }
}

class StatusUpdateGrid extends StatelessWidget {
  const StatusUpdateGrid({
    super.key,
    required this.currentStatus,
    required this.onUpdate,
  });

  final OrderStatus currentStatus;
  final ValueChanged<OrderStatus> onUpdate;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.5,
      children: _statusActions
          .map(
            (action) => _StatusUpdateButton(
              icon: action.icon,
              label: action.label,
              mmLabel: action.mmLabel,
              color: action.color,
              bgColor: action.bgColor,
              isActive: currentStatus == action.status,
              onTap: () => onUpdate(action.status),
            ),
          )
          .toList(growable: false),
    );
  }
}

class _StatusUpdateAction {
  const _StatusUpdateAction({
    required this.status,
    required this.icon,
    required this.label,
    required this.mmLabel,
    required this.color,
    required this.bgColor,
  });

  final OrderStatus status;
  final IconData icon;
  final String label;
  final String mmLabel;
  final Color color;
  final Color bgColor;
}

const List<_StatusUpdateAction> _statusActions = <_StatusUpdateAction>[
  _StatusUpdateAction(
    status: OrderStatus.confirmed,
    icon: Icons.check_circle_rounded,
    label: "Confirm Order",
    mmLabel: "အတည်ပြုမည်",
    color: AppColors.teal,
    bgColor: AppColors.tealLight,
  ),
  _StatusUpdateAction(
    status: OrderStatus.outForDelivery,
    icon: Icons.local_shipping_rounded,
    label: "Out for Delivery",
    mmLabel: "ပို့ဆောင်နေသည်",
    color: AppColors.yellow,
    bgColor: AppColors.yellowLight,
  ),
  _StatusUpdateAction(
    status: OrderStatus.delivered,
    icon: Icons.task_alt_rounded,
    label: "Mark Delivered",
    mmLabel: "ရောက်ပြီ",
    color: AppColors.green,
    bgColor: AppColors.greenLight,
  ),
  _StatusUpdateAction(
    status: OrderStatus.cancelled,
    icon: Icons.cancel_rounded,
    label: "Cancel Order",
    mmLabel: "ပယ်ဖျက်မည်",
    color: Color(0xFFEF4444),
    bgColor: Color(0xFFFEE2E2),
  ),
];

class _StatusUpdateButton extends StatelessWidget {
  const _StatusUpdateButton({
    required this.icon,
    required this.label,
    required this.mmLabel,
    required this.color,
    required this.bgColor,
    required this.isActive,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String mmLabel;
  final Color color;
  final Color bgColor;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isActive ? bgColor : Colors.white,
          border: Border.all(
            color: isActive ? color : AppColors.border,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            Text(
              mmLabel,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
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
  const CustomerInfoCard({
    super.key,
    required this.order,
    this.onCallTap,
    this.onMessageTap,
    this.onMapTap,
  });

  final OrderListItem order;
  final VoidCallback? onCallTap;
  final VoidCallback? onMessageTap;
  final VoidCallback? onMapTap;

  @override
  Widget build(BuildContext context) {
    final address = order.customerAddress?.trim();
    final township = order.customerTownship?.trim();
    final fullAddress = <String>[
      if (address != null && address.isNotEmpty) address,
      if (township != null && township.isNotEmpty) township,
    ].join(", ");

    return AppCard(
      showShadow: false,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AppSectionHeader(
            icon: Icon(Icons.person_outline_rounded),
            title: "Customer Info",
            subtitle: "ဖောက်သည်အချက်အလက်",
          ),
          _InfoRow(label: "Name", value: order.customerName),
          _InfoRow(label: "Phone", value: order.customerPhone),
          _InfoRow(
            label: "Address",
            value: fullAddress.isEmpty ? "-" : fullAddress,
            isMultiline: true,
            valueColor: AppColors.textMid,
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  text: "Call",
                  onPressed: onCallTap,
                  variant: AppButtonVariant.secondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppButton(
                  text: "Message",
                  onPressed: onMessageTap,
                  variant: AppButtonVariant.secondary,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: AppButton(
                  text: "Map",
                  onPressed: onMapTap,
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
  const ProductPaymentCard({super.key, required this.order, this.details});

  final OrderListItem order;
  final OrderDetails? details;

  @override
  Widget build(BuildContext context) {
    final items = details?.items ?? order.items;
    final deliveryFee = details?.deliveryFee ?? 0;
    final currency = details?.currency ?? order.currency;
    final numberFormat = NumberFormat.decimalPattern();

    return AppCard(
      showShadow: false,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AppSectionHeader(
            icon: Icon(Icons.inventory_2_outlined),
            title: "Product & Payment",
            subtitle: "ပစ္စည်းနှင့် ငွေပေးချေမှု",
            iconBackgroundColor: AppColors.tealLight,
            iconColor: AppColors.teal,
          ),
          ...items.map(
            (item) => _InfoRow(
              label: "${item.productName} x ${item.quantity}",
              value: "${numberFormat.format(item.lineTotal)} $currency",
            ),
          ),
          _InfoRow(
            label: "Delivery",
            value: "${numberFormat.format(deliveryFee)} $currency",
          ),
          _InfoRow(
            label: "Total",
            value: "${numberFormat.format(order.totalPrice)} $currency",
            isTotal: true,
          ),
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
          Expanded(
            child: Text(
              label.toUpperCase(),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                fontWeight: isTotal ? FontWeight.w900 : FontWeight.w800,
                color: isTotal ? AppColors.textDark : AppColors.textLight,
                letterSpacing: 0.4,
                fontSize: isTotal ? 12 : 11,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: isTotal
                    ? AppColors.softOrange
                    : (valueColor ?? AppColors.textDark),
                fontSize: isTotal ? 16 : 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ActivityLogCard extends StatelessWidget {
  const ActivityLogCard({
    super.key,
    required this.history,
    required this.createdAt,
    required this.currentStatus,
    required this.source,
  });

  final List<OrderStatusHistoryEvent> history;
  final DateTime createdAt;
  final OrderStatus currentStatus;
  final OrderSource source;

  @override
  Widget build(BuildContext context) {
    final events = history.isNotEmpty ? history : _fallbackEvents();

    return AppCard(
      showShadow: false,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AppSectionHeader(
            icon: Icon(Icons.history_rounded),
            title: "Activity Log",
            subtitle: "လှုပ်ရှားမှု မှတ်တမ်း",
            iconBackgroundColor: AppColors.yellowLight,
            iconColor: AppColors.yellow,
          ),
          AppTimeline(
            items: events
                .asMap()
                .entries
                .map((entry) {
                  final index = entry.key;
                  final event = entry.value;
                  return AppTimelineItem(
                    time: _formatTimelineTime(event.changedAt),
                    event: _statusEventTitle(event),
                    subtitle: _statusEventSubtitle(event),
                    color: _timelineColor(event.toStatus),
                    isLast: index == events.length - 1,
                  );
                })
                .toList(growable: false),
          ),
        ],
      ),
    );
  }

  List<OrderStatusHistoryEvent> _fallbackEvents() {
    return <OrderStatusHistoryEvent>[
      OrderStatusHistoryEvent(
        id: "created",
        fromStatus: null,
        toStatus: currentStatus,
        changedAt: createdAt,
        note: source == OrderSource.messenger
            ? "Created from Messenger message"
            : "Created manually",
      ),
    ];
  }
}

class OrderDetailsBottomBar extends StatelessWidget {
  const OrderDetailsBottomBar({
    super.key,
    required this.primaryLabel,
    required this.primaryEnabled,
    required this.onPrimaryPressed,
    required this.onSecondaryPressed,
    this.secondaryLabel = "Update Status",
    this.isPrimaryLoading = false,
  });

  final String primaryLabel;
  final bool primaryEnabled;
  final VoidCallback onPrimaryPressed;
  final VoidCallback onSecondaryPressed;
  final String secondaryLabel;
  final bool isPrimaryLoading;

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
              text: secondaryLabel,
              onPressed: isPrimaryLoading ? null : onSecondaryPressed,
              variant: AppButtonVariant.secondary,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: AppButton(
                text: primaryLabel,
                onPressed: primaryEnabled && !isPrimaryLoading
                    ? onPrimaryPressed
                    : null,
                isLoading: isPrimaryLoading,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _statusHeading(OrderStatus status) {
  switch (status) {
    case OrderStatus.newOrder:
      return "New Order";
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

AppStatusVariant _toBadgeVariant(OrderStatus status) {
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

String _statusEventTitle(OrderStatusHistoryEvent event) {
  switch (event.toStatus) {
    case OrderStatus.newOrder:
      return "Order created";
    case OrderStatus.confirmed:
      return "Order confirmed";
    case OrderStatus.outForDelivery:
      return "Out for delivery";
    case OrderStatus.delivered:
      return "Order delivered";
    case OrderStatus.cancelled:
      return "Order cancelled";
  }
}

String? _statusEventSubtitle(OrderStatusHistoryEvent event) {
  final note = event.note?.trim();
  if (note != null && note.isNotEmpty) {
    return note;
  }

  final changedBy = event.changedByName?.trim();
  if (changedBy != null && changedBy.isNotEmpty) {
    return "Updated by $changedBy";
  }

  return null;
}

String _formatTimelineTime(DateTime value) {
  final now = DateTime.now();
  final formatter = DateFormat("h:mm a");
  final time = formatter.format(value);

  if (value.year == now.year &&
      value.month == now.month &&
      value.day == now.day) {
    return "$time today";
  }

  return DateFormat("dd MMM, h:mm a").format(value);
}

AppTimelineColor _timelineColor(OrderStatus status) {
  switch (status) {
    case OrderStatus.newOrder:
      return AppTimelineColor.orange;
    case OrderStatus.confirmed:
      return AppTimelineColor.teal;
    case OrderStatus.outForDelivery:
      return AppTimelineColor.orange;
    case OrderStatus.delivered:
      return AppTimelineColor.teal;
    case OrderStatus.cancelled:
      return AppTimelineColor.gray;
  }
}
