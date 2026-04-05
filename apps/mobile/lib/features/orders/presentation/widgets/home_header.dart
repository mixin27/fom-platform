import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:fom_mobile/app/router/app_route_paths.dart';
import 'package:go_router/go_router.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({
    super.key,
    required this.selectedTab,
    required this.onTabChanged,
  });

  final int selectedTab;
  final ValueChanged<int> onTabChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.warmWhite,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Top
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Shop info
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [AppColors.softOrange, Color(0xFFFF8C5A)],
                          ),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        alignment: Alignment.center,
                        child: const Text('👗', style: TextStyle(fontSize: 20)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Ma Aye Shop',
                              style: TextTheme.of(context).bodyLarge?.copyWith(
                                fontWeight: FontWeight.w900,
                                color: AppColors.textDark,
                                fontSize: 15,
                                height: 1.2,
                              ),
                            ),
                            Text(
                              selectedTab == 2
                                  ? '8 orders need action'
                                  : 'Yangon Fashion · 23 orders today',
                              style: TextTheme.of(context).bodySmall?.copyWith(
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
                // Actions
                Row(
                  children: [
                    _IconBtn(
                      icon: '🔔',
                      hasDot: true,
                      onTap: () => context.push(AppRoutePaths.notifications),
                    ),
                    const SizedBox(width: 8),
                    _IconBtn(icon: '⋯', onTap: () {}),
                  ],
                ),
              ],
            ),
          ),

          // Pending Alert Banner (Shows only on Pending tab)
          if (selectedTab == 2)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFFDE68A),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  children: [
                    const Text('⚠️', style: TextStyle(fontSize: 18)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '8 orders need your attention',
                            style: TextTheme.of(context).labelSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF92400E),
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            'Confirm or update status now',
                            style: TextTheme.of(context).labelSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFFB45309),
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Summary Cards (Doesn't show on Pending tab in the design)
          if (selectedTab != 2)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Expanded(
                    child: _SummaryCard(
                      label: 'Today Orders',
                      value: '23',
                      changeText: '↑ 4 from yesterday',
                      isPositiveCount: true,
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _SummaryCard(
                      label: 'Revenue',
                      value: '485K',
                      changeText: '↑ MMK today',
                      valueFontSize: 15,
                      isPositiveCount: true,
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _SummaryCard(
                      label: 'Pending',
                      value: '8',
                      changeText: 'Need action',
                      valueColor: AppColors.yellow,
                      isPendingStatus: true,
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 16),

          // Filter Tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                const SizedBox(width: 14),
                _FilterTab(
                  label: 'All (23)',
                  isActive: selectedTab == 0,
                  onTap: () => onTabChanged(0),
                ),
                _FilterTab(
                  label: 'Today (12)',
                  isActive: selectedTab == 1,
                  onTap: () => onTabChanged(1),
                ),
                _FilterTab(
                  label: 'Pending (8)',
                  isActive: selectedTab == 2,
                  onTap: () => onTabChanged(2),
                ),
                _FilterTab(
                  label: 'Delivered (11)',
                  isActive: selectedTab == 3,
                  onTap: () => onTabChanged(3),
                ),
                const SizedBox(width: 14),
              ],
            ),
          ),
          // Divider for tabs bottom to match design border look
          Container(height: 1, color: AppColors.border),
        ],
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  const _IconBtn({required this.icon, this.hasDot = false, this.onTap});

  final String icon;
  final bool hasDot;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: AppColors.border, width: 2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Text(icon, style: const TextStyle(fontSize: 16)),
            if (hasDot)
              Positioned(
                top: 4,
                right: 4,
                child: Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(
                    color: AppColors.softOrange,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.label,
    required this.value,
    required this.changeText,
    this.valueColor = AppColors.textDark,
    this.valueFontSize = 20,
    this.isPositiveCount = false,
    this.isPendingStatus = false,
  });

  final String label;
  final String value;
  final String changeText;
  final Color valueColor;
  final double valueFontSize;
  final bool isPositiveCount;
  final bool isPendingStatus;

  @override
  Widget build(BuildContext context) {
    Color changeColor = AppColors.textMid;
    if (isPositiveCount) changeColor = AppColors.green;
    if (isPendingStatus) changeColor = AppColors.yellow;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.border, width: 1.5),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextTheme.of(context).labelSmall?.copyWith(
              fontWeight: FontWeight.w800,
              color: AppColors.textLight,
              fontSize: 9,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextTheme.of(context).titleLarge?.copyWith(
              fontWeight: FontWeight.w900,
              color: valueColor,
              fontSize: valueFontSize,
              height: 1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            changeText,
            style: TextTheme.of(context).labelSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: changeColor,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterTab extends StatelessWidget {
  const _FilterTab({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.background : Colors.transparent,
          border: Border(
            top: BorderSide(
              color: isActive ? AppColors.border : Colors.transparent,
              width: 2,
            ),
            left: BorderSide(
              color: isActive ? AppColors.border : Colors.transparent,
              width: 2,
            ),
            right: BorderSide(
              color: isActive ? AppColors.border : Colors.transparent,
              width: 2,
            ),
          ),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Text(
          label,
          style: TextTheme.of(context).labelSmall?.copyWith(
            fontWeight: FontWeight.w800,
            color: isActive ? AppColors.softOrange : AppColors.textLight,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
