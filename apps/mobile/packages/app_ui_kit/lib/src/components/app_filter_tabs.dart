import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
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
          final label = tabs[index];
          return _FilterTab(
            key: ValueKey('tab-$index-$label'),
            label: label,
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
    super.key,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Animate(target: isSelected ? 1 : 0).custom(
      duration: 250.ms,
      curve: Curves.easeOutCubic,
      builder: (context, value, _) {
        final backgroundColor = Color.lerp(
          Colors.transparent,
          AppColors.cream,
          value,
        );
        final borderColor = Color.lerp(
          Colors.transparent,
          AppColors.border,
          value,
        )!;
        final textColor = Color.lerp(
          AppColors.textLight,
          AppColors.softOrange,
          value,
        );

        return Container(
          decoration: BoxDecoration(
            color: backgroundColor,
            border: Border.all(color: borderColor, width: 2),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Center(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: textColor,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
