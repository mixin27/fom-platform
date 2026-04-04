import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

enum OrderStatusType { newOrder, confirmed, outForDelivery, delivered }

class OrderEntryData {
  const OrderEntryData({
    required this.id,
    required this.customerName,
    required this.customerPhone,
    required this.customerAvatar,
    required this.productSummary,
    required this.productIcon,
    required this.priceMmk,
    required this.timeLabel,
    required this.status,
  });

  final String id;
  final String customerName;
  final String customerPhone;
  final String customerAvatar;
  final String productSummary;
  final String productIcon;
  final int priceMmk;
  final String timeLabel;
  final OrderStatusType status;
}

class OrderCard extends StatelessWidget {
  const OrderCard({super.key, required this.data});

  final OrderEntryData data;

  Color get _statusColor {
    switch (data.status) {
      case OrderStatusType.newOrder:
        return AppColors.softOrange;
      case OrderStatusType.confirmed:
        return AppColors.teal;
      case OrderStatusType.outForDelivery:
        return AppColors.yellow;
      case OrderStatusType.delivered:
        return AppColors.green;
    }
  }

  Color get _statusBgColor {
    switch (data.status) {
      case OrderStatusType.newOrder:
        return AppColors.softOrangeLight;
      case OrderStatusType.confirmed:
        return AppColors.tealLight;
      case OrderStatusType.outForDelivery:
        return AppColors.yellowLight;
      case OrderStatusType.delivered:
        return AppColors.greenLight;
    }
  }

  String get _statusLabel {
    switch (data.status) {
      case OrderStatusType.newOrder:
        return 'NEW';
      case OrderStatusType.confirmed:
        return 'CONFIRMED';
      case OrderStatusType.outForDelivery:
        return 'ON THE WAY';
      case OrderStatusType.delivered:
        return 'DELIVERED ✓';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.border, width: 1.5),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Stack(
        children: [
          // Left border indicator
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: _statusColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  bottomLeft: Radius.circular(4),
                ),
              ),
            ),
          ),
          
          // Content
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top: Customer & Status
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: AppColors.softOrangeLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            alignment: Alignment.center,
                            child: Text(data.customerAvatar,
                                style: const TextStyle(fontSize: 16)),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  data.customerName,
                                  style: TextTheme.of(context).bodyLarge?.copyWith(
                                        fontWeight: FontWeight.w900,
                                        color: AppColors.textDark,
                                        fontSize: 14,
                                        height: 1.2,
                                      ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '📞 ${data.customerPhone}',
                                  style: TextTheme.of(context).labelSmall?.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textLight,
                                        fontSize: 11,
                                      ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusBgColor,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _statusLabel,
                        style: TextTheme.of(context).labelSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: _statusColor,
                              fontSize: 10,
                              letterSpacing: 0.4, // 0.04em
                            ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Middle: Product & Price
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Text(data.productIcon, style: const TextStyle(fontSize: 14)),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              data.productSummary,
                              style: TextTheme.of(context).bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textMid,
                                    fontSize: 12,
                                  ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text.rich(
                      TextSpan(
                        text: _formatInt(data.priceMmk),
                        style: TextTheme.of(context).titleMedium?.copyWith(
                              fontWeight: FontWeight.w900,
                              color: AppColors.textDark,
                              fontSize: 15,
                            ),
                        children: [
                          TextSpan(
                            text: ' MMK',
                            style: TextTheme.of(context).labelSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textLight,
                                  fontSize: 10,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 10),
                  child: Divider(color: AppColors.border, height: 1, thickness: 1),
                ),

                // Footer: ID & Time
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '#${data.id}',
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w700,
                        color: AppColors.textLight,
                        fontSize: 10,
                      ),
                    ),
                    Text(
                      data.timeLabel,
                      style: TextTheme.of(context).labelSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textLight,
                            fontSize: 10,
                          ),
                    ),
                  ],
                ),

                // Quick Actions (if not delivered)
                if (data.status != OrderStatusType.delivered) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: _buildQuickActions(context),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildQuickActions(BuildContext context) {
    if (data.status == OrderStatusType.newOrder) {
      return [
        Expanded(
          child: _QuickActionBtn(
            label: '✗ Cancel',
            isPrimary: false,
            onTap: () {},
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: _QuickActionBtn(
            label: '✓ Confirm',
            isPrimary: true,
            activeColor: AppColors.softOrange,
            onTap: () {},
          ),
        ),
      ];
    } else if (data.status == OrderStatusType.confirmed) {
      return [
        Expanded(
          child: _QuickActionBtn(
            label: '✉ Message',
            isPrimary: false,
            onTap: () {},
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: _QuickActionBtn(
            label: '🚚 Send Out',
            isPrimary: true,
            activeColor: AppColors.teal,
            activeBgColor: AppColors.tealLight,
            onTap: () {},
          ),
        ),
      ];
    } else if (data.status == OrderStatusType.outForDelivery) {
      return [
        Expanded(
          child: _QuickActionBtn(
            label: '📍 Track',
            isPrimary: false,
            onTap: () {},
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: _QuickActionBtn(
            label: '✓ Mark Delivered',
            isPrimary: true,
            activeColor: AppColors.teal,
            activeBgColor: AppColors.tealLight,
            onTap: () {},
          ),
        ),
      ];
    }

    return [];
  }

  String _formatInt(int num) {
    return num.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
  }
}

class _QuickActionBtn extends StatelessWidget {
  const _QuickActionBtn({
    required this.label,
    required this.isPrimary,
    this.activeColor,
    this.activeBgColor,
    required this.onTap,
  });

  final String label;
  final bool isPrimary;
  final Color? activeColor;
  final Color? activeBgColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final bgColor = isPrimary ? (activeBgColor ?? activeColor ?? AppColors.softOrange) : Colors.white;
    final fgColor = isPrimary ? (activeBgColor != null ? activeColor : Colors.white) : AppColors.textMid;
    final borderColor = isPrimary ? bgColor : AppColors.border;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: bgColor,
          border: Border.all(color: borderColor, width: 1.5),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          label,
          style: TextTheme.of(context).labelSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: fgColor,
                fontSize: 11,
              ),
        ),
      ),
    );
  }
}
