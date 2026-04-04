import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';

/// A custom card widget with consistent shadow and border radius.
class AppCard extends StatelessWidget {
  const AppCard({
    required this.child,
    super.key,
    this.padding,
    this.color = Colors.white,
    this.showShadow = true,
    this.borderRadius,
  });

  /// The widget to display within the card.
  final Widget child;

  /// Optional padding for the card content.
  final EdgeInsetsGeometry? padding;

  /// Background color of the card.
  final Color color;

  /// Whether to show the design shadow.
  final bool showShadow;

  /// Optional border radius.
  final double? borderRadius;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(
          borderRadius ?? AppSpacing.borderRadiusLg,
        ),
        boxShadow: showShadow
            ? [
                const BoxShadow(
                  color: AppColors.orangeShadow,
                  offset: Offset(0, 8),
                  blurRadius: 24,
                ),
              ]
            : null,
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: child,
    );
  }
}
