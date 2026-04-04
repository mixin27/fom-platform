import 'package:flutter/material.dart';

/// Typography tokens and helpers for the design system.
class AppTypography {
  const AppTypography._();

  /// Font family used for display and headline styles.
  static const String displayFontFamily = 'Poppins';

  /// Font family used for body and label styles.
  static const String bodyFontFamily = 'OpenSans';

  /// Package name used to resolve bundled fonts.
  static const String packageName = 'app_ui_kit';

  /// Apply the design system font families to a base [TextTheme].
  static TextTheme apply(TextTheme base) {
    return base.copyWith(
      displayLarge: _withFamily(base.displayLarge, displayFontFamily),
      displayMedium: _withFamily(base.displayMedium, displayFontFamily),
      displaySmall: _withFamily(base.displaySmall, displayFontFamily),
      headlineLarge: _withFamily(base.headlineLarge, displayFontFamily),
      headlineMedium: _withFamily(base.headlineMedium, displayFontFamily),
      headlineSmall: _withFamily(base.headlineSmall, displayFontFamily),
      titleLarge: _withFamily(base.titleLarge, displayFontFamily),
      titleMedium: _withFamily(base.titleMedium, displayFontFamily),
      titleSmall: _withFamily(base.titleSmall, displayFontFamily),
      bodyLarge: _withFamily(base.bodyLarge, bodyFontFamily),
      bodyMedium: _withFamily(base.bodyMedium, bodyFontFamily),
      bodySmall: _withFamily(base.bodySmall, bodyFontFamily),
      labelLarge: _withFamily(base.labelLarge, bodyFontFamily),
      labelMedium: _withFamily(base.labelMedium, bodyFontFamily),
      labelSmall: _withFamily(base.labelSmall, bodyFontFamily),
    );
  }

  static TextStyle? _withFamily(TextStyle? style, String family) {
    if (style == null) {
      return null;
    }
    return style.copyWith(fontFamily: family, package: packageName);
  }
}
