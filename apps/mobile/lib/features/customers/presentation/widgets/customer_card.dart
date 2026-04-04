import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

enum CustomerBadgeType { none, vip, newCustomer }

class CustomerListItemData {
  const CustomerListItemData({
    required this.id,
    required this.name,
    required this.phone,
    required this.location,
    required this.avatarEmoji,
    required this.avatarBgColor,
    required this.spentMmk,
    required this.ordersCount,
    required this.lastActive,
    this.badgeType = CustomerBadgeType.none,
  });

  final String id;
  final String name;
  final String phone;
  final String location;
  final String avatarEmoji;
  final Color avatarBgColor;
  final int spentMmk;
  final int ordersCount;
  final String lastActive;
  final CustomerBadgeType badgeType;
}

class CustomerCard extends StatelessWidget {
  const CustomerCard({super.key, required this.data, this.onTap});

  final CustomerListItemData data;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border, width: 1.5),
        ),
        child: Row(
          children: [
            // Avatar
            SizedBox(
              width: 48,
              height: 48,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      color: data.avatarBgColor,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      data.avatarEmoji,
                      style: const TextStyle(fontSize: 22),
                    ),
                  ),
                  if (data.badgeType != CustomerBadgeType.none)
                    Positioned(
                      bottom: -3,
                      right: -3,
                      child: Container(
                        width: 18,
                        height: 18,
                        decoration: BoxDecoration(
                          color: _getBadgeBgColor(data.badgeType),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          _getBadgeText(data.badgeType),
                          style: TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                            color: _getBadgeTextColor(data.badgeType),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          data.name,
                          style: TextTheme.of(context).bodyLarge?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: AppColors.textDark,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (data.badgeType == CustomerBadgeType.vip)
                        _buildChip(
                          context,
                          'VIP',
                          const Color(0xFFFEF3C7),
                          const Color(0xFFD97706),
                        ),
                      if (data.badgeType == CustomerBadgeType.newCustomer)
                        _buildChip(
                          context,
                          'NEW',
                          AppColors.tealLight,
                          AppColors.teal,
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(
                        '📞 ${data.phone}',
                        style: TextTheme.of(context).labelSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textLight,
                          fontSize: 11,
                        ),
                      ),
                      Container(
                        width: 3,
                        height: 3,
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        decoration: const BoxDecoration(
                          color: AppColors.border,
                          shape: BoxShape.circle,
                        ),
                      ),
                      Flexible(
                        child: Text(
                          data.location,
                          style: TextTheme.of(context).labelSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textLight,
                            fontSize: 11,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Right Stats
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${_formatInt(data.spentMmk)}K MMK',
                  style: TextTheme.of(context).titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${data.ordersCount} ${data.ordersCount == 1 ? 'order' : 'orders'}',
                  style: TextTheme.of(context).labelSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textLight,
                    fontSize: 10,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  data.lastActive,
                  style: TextTheme.of(context).labelSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: AppColors.teal,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(
    BuildContext context,
    String label,
    Color bgColor,
    Color textColor,
  ) {
    return Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextTheme.of(context).labelSmall?.copyWith(
          fontWeight: FontWeight.w800,
          color: textColor,
          fontSize: 9,
        ),
      ),
    );
  }

  Color _getBadgeBgColor(CustomerBadgeType type) {
    if (type == CustomerBadgeType.vip) return const Color(0xFFFCD34D);
    if (type == CustomerBadgeType.newCustomer) return AppColors.teal;
    return Colors.transparent;
  }

  Color _getBadgeTextColor(CustomerBadgeType type) {
    if (type == CustomerBadgeType.newCustomer) return Colors.white;
    return Colors.black;
  }

  String _getBadgeText(CustomerBadgeType type) {
    if (type == CustomerBadgeType.vip) return '⭐';
    if (type == CustomerBadgeType.newCustomer) return 'N';
    return '';
  }

  String _formatInt(int num) {
    return (num ~/ 1000).toString();
  }
}
