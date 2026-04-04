import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';

/// Supported button variants for the App UI kit.
enum AppButtonVariant { primary, secondary, tertiary, facebook }

/// A custom button widget with design system styling and animations.
class AppButton extends StatefulWidget {
  const AppButton({
    required this.text,
    required this.onPressed,
    super.key,
    this.variant = AppButtonVariant.primary,
    this.isLoading = false,
    this.icon,
  });

  /// The text to display on the button.
  final String text;

  /// Callback when the button is pressed.
  final VoidCallback? onPressed;

  /// The variant of the button.
  final AppButtonVariant variant;

  /// Whether to show a loading indicator.
  final bool isLoading;

  /// Optional icon to display.
  final Widget? icon;

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPrimary = widget.variant == AppButtonVariant.primary;
    final isSecondary = widget.variant == AppButtonVariant.secondary;

    Color backgroundColor;
    Color foregroundColor;
    BorderSide borderSide = BorderSide.none;
    List<BoxShadow> boxShadow = [];

    switch (widget.variant) {
      case AppButtonVariant.primary:
        backgroundColor = AppColors.softOrange;
        foregroundColor = Colors.white;
        boxShadow = [
          BoxShadow(
            color: AppColors.orangeShadow,
            offset: const Offset(0, 8),
            blurRadius: 24,
          ),
        ];
        break;
      case AppButtonVariant.secondary:
        backgroundColor = Colors.transparent;
        foregroundColor = AppColors.textMid;
        borderSide = const BorderSide(color: AppColors.border, width: 2);
        break;
      case AppButtonVariant.tertiary:
        backgroundColor = Colors.transparent;
        foregroundColor = AppColors.textMid;
        break;
      case AppButtonVariant.facebook:
        backgroundColor = AppColors.facebookBlue;
        foregroundColor = Colors.white;
        break;
    }

    if (widget.onPressed == null) {
      backgroundColor = backgroundColor.withValues(alpha: 0.5);
      foregroundColor = foregroundColor.withValues(alpha: 0.5);
      boxShadow = [];
    }

    return GestureDetector(
          onTapDown: (_) => setState(() => _isPressed = true),
          onTapUp: (_) => setState(() => _isPressed = false),
          onTapCancel: () => setState(() => _isPressed = false),
          onTap: widget.isLoading ? null : widget.onPressed,
          child: AnimatedContainer(
            duration: 150.ms,
            height: 56,
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(AppSpacing.borderRadiusLg),
              border: Border.fromBorderSide(borderSide),
              boxShadow: boxShadow,
              gradient: isPrimary
                  ? const LinearGradient(
                      colors: [AppColors.softOrange, Color(0xFFFF8C5A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    )
                  : null,
            ),
            transform: _isPressed
                ? (Matrix4.identity()..scaleByDouble(0.98, 0.98, 1.0, 1.0))
                : Matrix4.identity(),
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            child: widget.isLoading
                ? SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        foregroundColor,
                      ),
                    ),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (widget.icon != null) ...[
                        widget.icon!,
                        const SizedBox(width: AppSpacing.sm),
                      ],
                      Text(
                        widget.text,
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: foregroundColor,
                          fontSize: isSecondary ? 14 : 16,
                          fontWeight: isSecondary
                              ? FontWeight.w700
                              : FontWeight.w800,
                          letterSpacing: 0.01,
                        ),
                      ),
                    ],
                  ),
          ),
        )
        .animate(target: _isPressed ? 1 : 0)
        .scale(
          begin: const Offset(1, 1),
          end: const Offset(0.98, 0.98),
          duration: 100.ms,
        );
  }
}
