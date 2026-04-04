import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';

/// A square-rounded icon button with design system styling.
class AppIconButton extends StatelessWidget {
  const AppIconButton({
    required this.icon,
    required this.onPressed,
    super.key,
    this.isSelected = false,
    this.showBadge = false,
  });

  /// The icon to display.
  final Widget icon;

  /// Callback when the button is pressed.
  final VoidCallback? onPressed;

  /// Whether the button is in its selected/active state.
  final bool isSelected;

  /// Whether to show a notification badge/dot.
  final bool showBadge;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppSpacing.borderRadiusSm),
              border: Border.all(
                color: isSelected ? AppColors.softOrange : AppColors.border,
                width: 2,
              ),
            ),
            child: Center(
              child: IconTheme(
                data: IconThemeData(
                  size: 18,
                  color: isSelected ? AppColors.softOrange : AppColors.textDark,
                ),
                child: icon,
              ),
            ),
          ),
          if (showBadge)
            Positioned(
              top: 6,
              right: 6,
              child: Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: AppColors.softOrange,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
