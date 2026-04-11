import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';

/// A custom text field widget for consistent form styling.
class AppTextField extends StatelessWidget {
  const AppTextField({
    this.label,
    this.hintText,
    this.controller,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.maxLines = 1,
    this.textInputAction,
    this.onChanged,
    this.validator,
    super.key,
  });

  /// The label to display above the text field.
  final String? label;

  /// The hint text to display within the text field.
  final String? hintText;

  /// The controller for the text field.
  final TextEditingController? controller;

  /// The prefix icon to display.
  final Widget? prefixIcon;

  /// The suffix icon to display.
  final Widget? suffixIcon;

  /// Whether to obscure the text (e.g. for password).
  final bool obscureText;

  /// The keyboard type for input.
  final TextInputType? keyboardType;

  /// The maximum number of lines.
  final int? maxLines;

  /// The text input action.
  final TextInputAction? textInputAction;

  /// Callback when the text changes.
  final ValueChanged<String>? onChanged;

  /// Validator for the text field.
  final FormFieldValidator<String>? validator;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: Text(
              label!,
              style: theme.textTheme.labelLarge?.copyWith(
                color: AppColors.textDark,
                fontWeight: FontWeight.w800,
                fontSize: 12,
                letterSpacing: 0.06,
              ),
            ),
          ),
        ],
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          maxLines: maxLines,
          textInputAction: textInputAction,
          onChanged: onChanged,
          validator: validator,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: AppColors.textDark,
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
          decoration: InputDecoration(
            hintText: hintText,
            prefixIcon: prefixIcon != null
                ? Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                    ),
                    child: prefixIcon,
                  )
                : null,
            prefixIconConstraints: const BoxConstraints(
              minWidth: 40,
              minHeight: 24,
            ),
            suffixIcon: suffixIcon,
          ),
        ),
      ],
    );
  }
}
