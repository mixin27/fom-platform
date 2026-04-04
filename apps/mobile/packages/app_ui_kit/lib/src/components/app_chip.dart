import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// A custom chip/badge widget with design system styling and animations.
class AppChip extends StatelessWidget {
  const AppChip({
    required this.label,
    super.key,
    this.isSelected = false,
    this.icon,
    this.onTap,
  });

  /// The text to display on the chip.
  final String label;

  /// Whether the chip is selected.
  final bool isSelected;

  /// Optional leading icon.
  final Widget? icon;

  /// Callback when the chip is tapped.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.softOrangeLight : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.softOrange : AppColors.border,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              offset: const Offset(0, 2),
              blurRadius: 8,
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[icon!, const SizedBox(width: 5)],
            Text(
              label,
              style: theme.textTheme.labelLarge?.copyWith(
                color: isSelected ? AppColors.textDark : AppColors.textMid,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
