import "package:flutter/material.dart";

import "../tokens/app_colors.dart";
import "app_alert_banner.dart";
import "app_filter_tabs.dart";
import "app_icon_button.dart";
import "app_summary_card.dart";

class AppOrdersHomeHeader extends StatelessWidget {
  const AppOrdersHomeHeader({
    required this.shopName,
    required this.shopSubtitle,
    required this.tabs,
    required this.selectedTabIndex,
    required this.onTabSelected,
    required this.todayOrdersCount,
    required this.todayRevenueText,
    required this.pendingCount,
    super.key,
    this.showSummaryCards = true,
    this.showPendingAlert = false,
    this.pendingAlertTitle,
    this.pendingAlertMessage,
    this.onNotificationPressed,
    this.onMorePressed,
    this.hasUnreadNotifications = false,
    this.leading,
    this.showTrailingActions = true,
    this.todayOrdersLabel = "Today Orders",
    this.revenueLabel = "Revenue",
    this.revenueSubtitle = "MMK today",
    this.pendingLabel = "Pending",
  });

  final String shopName;
  final String shopSubtitle;
  final List<String> tabs;
  final int selectedTabIndex;
  final ValueChanged<int> onTabSelected;
  final int todayOrdersCount;
  final String todayRevenueText;
  final int pendingCount;
  final bool showSummaryCards;
  final bool showPendingAlert;
  final String? pendingAlertTitle;
  final String? pendingAlertMessage;
  final VoidCallback? onNotificationPressed;
  final VoidCallback? onMorePressed;
  final bool hasUnreadNotifications;
  final Widget? leading;
  final bool showTrailingActions;
  final String todayOrdersLabel;
  final String revenueLabel;
  final String revenueSubtitle;
  final String pendingLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      color: AppColors.warmWhite,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            child: Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      if (leading != null) ...[
                        leading!,
                        const SizedBox(width: 8),
                      ],
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
                        child: const Icon(
                          Icons.storefront_rounded,
                          size: 20,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              shopName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodyLarge?.copyWith(
                                fontWeight: FontWeight.w900,
                                color: AppColors.textDark,
                                fontSize: 15,
                                height: 1.2,
                              ),
                            ),
                            Text(
                              shopSubtitle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodySmall?.copyWith(
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
                if (showTrailingActions)
                  Row(
                    children: [
                      AppIconButton(
                        icon: const Icon(Icons.notifications_none_rounded),
                        onPressed: onNotificationPressed,
                        showBadge: hasUnreadNotifications,
                      ),
                      const SizedBox(width: 8),
                      AppIconButton(
                        icon: const Icon(Icons.more_horiz_rounded),
                        onPressed: onMorePressed,
                      ),
                    ],
                  ),
              ],
            ),
          ),
          if (showPendingAlert)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
              child: AppAlertBanner(
                title:
                    pendingAlertTitle ?? "$pendingCount orders need attention",
                message: pendingAlertMessage ?? "Confirm or update status now",
                icon: const Icon(
                  Icons.warning_amber_rounded,
                  size: 20,
                  color: Color(0xFF92400E),
                ),
                backgroundColor: const Color(0xFFFEF3C7),
                borderColor: const Color(0xFFFDE68A),
                titleColor: const Color(0xFF92400E),
                messageColor: const Color(0xFFB45309),
              ),
            ),
          if (showSummaryCards)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Row(
                children: [
                  Expanded(
                    child: AppSummaryCard(
                      label: todayOrdersLabel,
                      value: "$todayOrdersCount",
                      changeText: todayOrdersCount > 0
                          ? "Active orders"
                          : "No orders yet",
                      isPositiveChange: true,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: AppSummaryCard(
                      label: revenueLabel,
                      value: todayRevenueText,
                      valueColor: AppColors.textDark,
                      changeText: revenueSubtitle,
                      isPositiveChange: true,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: AppSummaryCard(
                      label: pendingLabel,
                      value: "$pendingCount",
                      valueColor: AppColors.yellow,
                      changeText: pendingCount > 0
                          ? "Need action"
                          : "All clear",
                      isPositiveChange: false,
                    ),
                  ),
                ],
              ),
            ),
          AppFilterTabs(
            tabs: tabs,
            selectedIndex: selectedTabIndex,
            onTabSelected: onTabSelected,
          ),
          Container(height: 1, color: AppColors.border),
        ],
      ),
    );
  }
}
