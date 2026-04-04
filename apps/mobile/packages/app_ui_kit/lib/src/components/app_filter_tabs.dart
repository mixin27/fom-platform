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
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: tabs.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final isSelected = index == selectedIndex;
          return _FilterTab(
            label: tabs[index],
            isSelected: isSelected,
            onTap: () => onTabSelected(index),
          );
        },
      ),
    );
  }
}

class _FilterTab extends StatelessWidget {
  const _FilterTab({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.cream : Colors.transparent,
          border: Border.all(
            color: isSelected ? AppColors.border : Colors.transparent,
            width: 2,
          ),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        ),
        child: Center(
          child: Text(
            label,
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
