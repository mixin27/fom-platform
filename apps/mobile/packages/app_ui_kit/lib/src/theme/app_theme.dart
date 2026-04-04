import 'package:flutter/material.dart';

import '../tokens/app_colors.dart';
import '../tokens/app_typography.dart';

/// Central theme configuration for the app UI kit.
///
/// Provides consistent Material 3 theming and color scheme defaults.
class AppTheme {
  const AppTheme._();

  /// Light theme built from [AppColors.primary].
  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: AppColors.primary),
    );

    final textTheme = AppTypography.apply(base.textTheme);
    final primaryTextTheme = AppTypography.apply(base.primaryTextTheme);

    return base.copyWith(
      textTheme: textTheme,
      primaryTextTheme: primaryTextTheme,
      appBarTheme: const AppBarTheme(centerTitle: true),
      cardTheme: const CardThemeData(elevation: 0, margin: EdgeInsets.zero),
    );
  }
}
