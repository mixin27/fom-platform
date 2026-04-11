import 'package:flutter/material.dart';

import '../tokens/app_colors.dart';
import 'app_avatar.dart';

class AppCustomerProfileHeader extends StatelessWidget {
  const AppCustomerProfileHeader({
    required this.name,
    required this.phone,
    required this.totalOrdersText,
    required this.totalSpentText,
    required this.averageOrderText,
    required this.deliveredRateText,
    super.key,
    this.township,
    this.avatarUrl,
    this.isVip = false,
    this.isLoyal = false,
    this.onBackPressed,
    this.onMorePressed,
  });

  final String name;
  final String phone;
  final String? township;
  final String? avatarUrl;
  final bool isVip;
  final bool isLoyal;
  final String totalOrdersText;
  final String totalSpentText;
  final String averageOrderText;
  final String deliveredRateText;
  final VoidCallback? onBackPressed;
  final VoidCallback? onMorePressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A1A2E), Color(0xFF2A2A4E)],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.softOrange.withValues(alpha: 0.18),
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _HeaderButton(
                        icon: Icons.arrow_back_rounded,
                        onTap: onBackPressed,
                      ),
                      Text(
                        'Customer Profile',
                        style: theme.textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 12,
                        ),
                      ),
                      _HeaderButton(
                        icon: Icons.more_horiz_rounded,
                        onTap: onMorePressed,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 3,
                          ),
                        ),
                        child: AppAvatar(
                          size: 60,
                          imageUrl: avatarUrl,
                          borderRadius: 18,
                          backgroundColor: AppColors.softOrangeLight,
                          icon: const Icon(Icons.person_rounded),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                fontSize: 18,
                                height: 1.1,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              _buildPhoneLine(),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodySmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: Colors.white.withValues(alpha: 0.6),
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                if (isVip)
                                  const _HeaderChip(
                                    label: 'VIP',
                                    icon: Icons.workspace_premium_rounded,
                                    backgroundColor: Color(0xFFFCD34D),
                                    foregroundColor: Color(0xFF92400E),
                                  ),
                                if (isLoyal)
                                  const _HeaderChip(
                                    label: 'Loyal',
                                    icon: Icons.repeat_rounded,
                                    backgroundColor: Color(0x3342A8A0),
                                    foregroundColor: Color(0xFF7DF0EB),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _HeaderStat(value: totalOrdersText, label: 'Orders'),
                        _HeaderStat(
                          value: totalSpentText,
                          label: 'MMK Spent',
                          valueColor: const Color(0xFFFF9F7A),
                        ),
                        _HeaderStat(
                          value: averageOrderText,
                          label: 'Avg Order',
                        ),
                        _HeaderStat(
                          value: deliveredRateText,
                          label: 'Delivered',
                          valueColor: const Color(0xFF4ADE80),
                          showBorder: false,
                        ),
                      ],
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

  String _buildPhoneLine() {
    final normalizedTownship = township?.trim() ?? '';
    if (normalizedTownship.isEmpty) {
      return phone;
    }

    return "$phone - $normalizedTownship";
  }
}

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.2),
            width: 1.5,
          ),
        ),
        child: Icon(icon, size: 18, color: Colors.white),
      ),
    );
  }
}

class _HeaderChip extends StatelessWidget {
  const _HeaderChip({
    required this.label,
    required this.icon,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final String label;
  final IconData icon;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: foregroundColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: foregroundColor,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderStat extends StatelessWidget {
  const _HeaderStat({
    required this.value,
    required this.label,
    this.showBorder = true,
    this.valueColor = Colors.white,
  });

  final String value;
  final String label;
  final bool showBorder;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        decoration: BoxDecoration(
          border: showBorder
              ? Border(
                  right: BorderSide(
                    color: Colors.white.withValues(alpha: 0.1),
                    width: 1,
                  ),
                )
              : null,
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: valueColor,
                height: 1,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: Colors.white.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
