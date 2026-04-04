import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// A selectable option tile for status selection or picking items.
class AppSelectionOption extends StatelessWidget {
  const AppSelectionOption({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    super.key,
    this.subtitle,
    this.selectedBorderColor,
    this.selectedBackgroundColor,
  });

  /// The icon for this option.
  final Widget icon;

  /// The primary label.
  final String label;

  /// Optional subtitle.
  final String? subtitle;

  /// Whether the option is currently selected.
  final bool isSelected;

  /// Callback when the option is tapped.
  final VoidCallback onTap;

  /// Optional override for the border color when selected.
  final Color? selectedBorderColor;

  /// Optional override for the background color when selected.
  final Color? selectedBackgroundColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Dynamic coloring based on selection or provided overrides.
    final borderColor = isSelected
        ? (selectedBorderColor ?? AppColors.softOrange)
        : AppColors.border;
    final backgroundColor = isSelected
        ? (selectedBackgroundColor ??
              AppColors.softOrange.withValues(alpha: 0.1))
        : Colors.white;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: backgroundColor,
          border: Border.all(color: borderColor, width: 2),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconTheme(
              data: IconThemeData(
                size: 20,
                color: isSelected
                    ? (selectedBorderColor ?? AppColors.softOrange)
                    : AppColors.textLight,
              ),
              child: icon,
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: theme.textTheme.labelMedium?.copyWith(
                color: isSelected
                    ? (selectedBorderColor ?? AppColors.softOrange)
                    : AppColors.textLight,
                fontWeight: FontWeight.w800,
                fontSize: 10,
              ),
            ),
            if (subtitle != null)
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: isSelected
                      ? (selectedBorderColor ?? AppColors.softOrange)
                      : AppColors.textLight,
                  fontWeight: FontWeight.w700,
                  fontSize: 9,
                  fontFamily: 'NotoSansMyanmar',
                ),
              ),
          ],
        ),
      ),
    );
  }
}
