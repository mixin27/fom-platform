import 'package:flutter/material.dart';

import '../tokens/app_colors.dart';
import 'app_filter_tabs.dart';
import 'app_icon_button.dart';
import 'app_search_bar.dart';

class AppCustomersHomeHeader extends StatelessWidget {
  const AppCustomersHomeHeader({
    required this.title,
    required this.subtitle,
    required this.searchHintText,
    required this.tabs,
    required this.selectedTabIndex,
    required this.onTabSelected,
    required this.searchController,
    super.key,
    this.onSearchChanged,
    this.onSortPressed,
    this.onAddPressed,
    this.onNotificationPressed,
    this.showNotificationAction = false,
  });

  final String title;
  final String subtitle;
  final String searchHintText;
  final List<String> tabs;
  final int selectedTabIndex;
  final ValueChanged<int> onTabSelected;
  final TextEditingController searchController;
  final ValueChanged<String>? onSearchChanged;
  final VoidCallback? onSortPressed;
  final VoidCallback? onAddPressed;
  final VoidCallback? onNotificationPressed;
  final bool showNotificationAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      color: AppColors.warmWhite,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: AppColors.textDark,
                          fontSize: 18,
                          height: 1.2,
                        ),
                      ),
                      Text(
                        subtitle,
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
                Row(
                  children: [
                    if (showNotificationAction) ...[
                      AppIconButton(
                        icon: const Icon(Icons.notifications_none_rounded),
                        onPressed: onNotificationPressed,
                      ),
                      const SizedBox(width: 8),
                    ],
                    if (onSortPressed != null)
                      AppIconButton(
                        icon: const Icon(Icons.swap_vert_rounded),
                        onPressed: onSortPressed,
                      ),
                    const SizedBox(width: 8),
                    AppIconButton(
                      icon: const Icon(Icons.person_add_alt_1_rounded),
                      onPressed: onAddPressed,
                    ),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: AppSearchBar(
              controller: searchController,
              hintText: searchHintText,
              onChanged: onSearchChanged,
            ),
          ),
          const SizedBox(height: 12),
          AppFilterTabs(
            tabs: tabs,
            selectedIndex: selectedTabIndex,
            onTabSelected: onTabSelected,
          ),
          Container(height: 1.5, color: AppColors.border),
        ],
      ),
    );
  }
}
