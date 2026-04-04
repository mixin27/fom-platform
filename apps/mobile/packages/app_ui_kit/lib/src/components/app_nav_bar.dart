import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// A custom bottom navigation item for the App UI kit.
class AppNavBarItem extends StatelessWidget {
  const AppNavBarItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    super.key,
  });

  /// The icon to display.
  final Widget icon;

  /// The label for the item.
  final String label;

  /// Whether the item is currently selected.
  final bool isSelected;

  /// Callback when the item is tapped.
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconTheme(
              data: IconThemeData(
                size: 22,
                color: isSelected ? AppColors.softOrange : AppColors.textLight,
              ),
              child: icon,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: isSelected ? AppColors.softOrange : AppColors.textLight,
                letterSpacing: 0.02,
              ),
            ),
            if (isSelected) ...[
              const SizedBox(height: 4),
              Container(
                width: 4,
                height: 4,
                decoration: const BoxDecoration(
                  color: AppColors.softOrange,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// A customized bottom navigation bar for the App UI kit.
class AppNavBar extends StatelessWidget {
  const AppNavBar({required this.items, super.key});

  /// The list of items to display in the navigation bar.
  final List<AppNavBarItem> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 10, bottom: 18),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border, width: 1.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: items,
      ),
    );
  }
}
