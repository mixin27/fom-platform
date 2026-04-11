import 'package:flutter/material.dart';

import '../tokens/app_colors.dart';

/// A horizontal scrollable tab bar for filtering categories.
class AppFilterTabs extends StatelessWidget {
  const AppFilterTabs({
    required this.tabs,
    required this.selectedIndex,
    required this.onTabSelected,
    super.key,
  });

  /// The list of tab labels (e.g., "All (23)", "Pending (8)").
  final List<String> tabs;

  /// The currently selected tab index.
  final int selectedIndex;

  /// Callback when a tab is selected.
  final ValueChanged<int> onTabSelected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: List.generate(tabs.length, (index) {
            final label = tabs[index].trim().isEmpty ? 'Tab' : tabs[index];

            return Padding(
              padding: EdgeInsets.only(left: index == 0 ? 0 : 8),
              child: _StaticFilterTab(
                label: label,
                isSelected: selectedIndex == index,
                onTap: () => onTabSelected(index),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _StaticFilterTab extends StatelessWidget {
  const _StaticFilterTab({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    const borderRadius = BorderRadius.vertical(top: Radius.circular(16));

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: borderRadius,
        child: Container(
          height: 44,
          alignment: Alignment.center,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.cream : Colors.transparent,
            borderRadius: borderRadius,
            border: isSelected
                ? Border.all(color: AppColors.border, width: 2)
                : null,
          ),
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: isSelected ? AppColors.softOrange : AppColors.textLight,
            ),
          ),
        ),
      ),
    );
  }
}
