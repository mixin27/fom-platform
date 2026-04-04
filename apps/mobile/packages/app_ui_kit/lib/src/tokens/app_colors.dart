import 'package:flutter/material.dart';

/// Shared color tokens for the UI kit.
class AppColors {
  const AppColors._();

  /// Primary brand color.
  static const Color softOrange = Color(0xFFFF6B35);
  static const Color softOrangeLight = Color(0xFFFFF0EB);
  static const Color softOrangeMid = Color(0xFFFFD4C2);

  /// Secondary brand color.
  static const Color teal = Color(0xFF2AA8A0);
  static const Color tealLight = Color(0xFFE8F7F6);

  /// Background and surface colors.
  static const Color cream = Color(0xFFFDF9F4);
  static const Color warmWhite = Color(0xFFFFFCF8);
  static const Color background = Color(0xFFF0EBE3);

  /// Text colors.
  static const Color textDark = Color(0xFF1A1A2E);
  static const Color textMid = Color(0xFF5A5A7A);
  static const Color textLight = Color(0xFF9999BB);

  /// Utility colors.
  static const Color border = Color(0xFFEDE8E0);
  static const Color shadow = Color(
    0x1F000000,
  ); // placeholder for shadow if needed
  static const Color orangeShadow = Color(
    0x1FFF6B35,
  ); // design uses rgba(255,107,53,0.12) approx 0x1F

  /// Third party colors.
  static const Color facebookBlue = Color(0xFF1877F2);

  /// Mapping for Material Theme.
  static const Color primary = softOrange;
  static const Color secondary = teal;
}
