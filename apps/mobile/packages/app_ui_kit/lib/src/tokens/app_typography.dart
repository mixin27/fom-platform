import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Typography tokens and helpers for the design system.
class AppTypography {
  const AppTypography._();

  /// Font family used for display and headline styles.
  static const String fontFamily = 'Nunito';

  /// Font family used for Myanmar text.
  static const String myanmarFontFamily = 'NotoSansMyanmar';

  /// Package name used to resolve bundled fonts.
  static const String packageName = 'app_ui_kit';

  /// Apply the design system font families to a base [TextTheme].
  static TextTheme apply(TextTheme base) {
    return base.copyWith(
      displayLarge: _withFamily(
        base.displayLarge,
        fontFamily,
        AppColors.textDark,
        fontWeight: FontWeight.w900,
      ),
      displayMedium: _withFamily(
        base.displayMedium,
        fontFamily,
        AppColors.textDark,
        fontWeight: FontWeight.w900,
      ),
      displaySmall: _withFamily(
        base.displaySmall,
        fontFamily,
        AppColors.textDark,
        fontWeight: FontWeight.w900,
      ),
      headlineLarge: _withFamily(
        base.headlineLarge,
        fontFamily,
        AppColors.textDark,
        fontWeight: FontWeight.w800,
      ),
      headlineMedium: _withFamily(
        base.headlineMedium,
        fontFamily,
        AppColors.textDark,
        fontWeight: FontWeight.w800,
      ),
      headlineSmall: _withFamily(
        base.headlineSmall,
        fontFamily,
        AppColors.textDark,
        fontWeight: FontWeight.w800,
      ),
      titleLarge: _withFamily(
        base.titleLarge,
        fontFamily,
        AppColors.textDark,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: _withFamily(
        base.titleMedium,
        fontFamily,
        AppColors.textDark,
        fontWeight: FontWeight.w700,
      ),
      titleSmall: _withFamily(
        base.titleSmall,
        fontFamily,
        AppColors.textDark,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: _withFamily(
        base.bodyLarge,
        fontFamily,
        AppColors.textMid,
        fontWeight: FontWeight.w600,
      ),
      bodyMedium: _withFamily(
        base.bodyMedium,
        fontFamily,
        AppColors.textMid,
        fontWeight: FontWeight.w600,
      ),
      bodySmall: _withFamily(
        base.bodySmall,
        fontFamily,
        AppColors.textMid,
        fontWeight: FontWeight.w600,
      ),
      labelLarge: _withFamily(
        base.labelLarge,
        fontFamily,
        AppColors.textLight,
        fontWeight: FontWeight.w700,
      ),
      labelMedium: _withFamily(
        base.labelMedium,
        fontFamily,
        AppColors.textLight,
        fontWeight: FontWeight.w700,
      ),
      labelSmall: _withFamily(
        base.labelSmall,
        fontFamily,
        AppColors.textLight,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  /// Create a [TextStyle] with Myanmar font support.
  static TextStyle myanmarStyle({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
  }) {
    return TextStyle(
      fontFamily: myanmarFontFamily,
      package: packageName,
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
    );
  }

  static TextStyle? _withFamily(
    TextStyle? style,
    String family,
    Color color, {
    FontWeight? fontWeight,
  }) {
    if (style == null) {
      return null;
    }
    return style.copyWith(
      fontFamily: family,
      package: packageName,
      color: color,
      fontWeight: fontWeight,
    );
  }
}
