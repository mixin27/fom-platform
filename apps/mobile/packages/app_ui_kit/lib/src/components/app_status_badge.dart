import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// Supported status variants for the badge.
enum AppStatusVariant { newOrder, confirmed, shipping, delivered }

/// A pill-shaped status indicator with defined design color states.
class AppStatusBadge extends StatelessWidget {
  const AppStatusBadge({required this.variant, super.key, this.label});

  /// The status variant (e.g., new order, confirmed).
  final AppStatusVariant variant;

  /// Optional custom label to display instead of the default.
  final String? label;

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color foregroundColor;
    String text;

    switch (variant) {
      case AppStatusVariant.newOrder:
        backgroundColor = AppColors.softOrangeLight;
        foregroundColor = AppColors.softOrange;
        text = 'NEW';
        break;
      case AppStatusVariant.confirmed:
        backgroundColor = AppColors.tealLight;
        foregroundColor = AppColors.teal;
        text = 'CONFIRMED';
        break;
      case AppStatusVariant.shipping:
        backgroundColor = const Color(0xFFFEF3C7);
        foregroundColor = const Color(0xFFF59E0B);
        text = 'ON THE WAY';
        break;
      case AppStatusVariant.delivered:
        backgroundColor = const Color(0xFFDCFCE7);
        foregroundColor = const Color(0xFF22C55E);
        text = 'DELIVERED ✓';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label ?? text,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: foregroundColor,
          fontWeight: FontWeight.w800,
          fontSize: 10,
          letterSpacing: 0.04,
        ),
      ),
    );
  }
}
