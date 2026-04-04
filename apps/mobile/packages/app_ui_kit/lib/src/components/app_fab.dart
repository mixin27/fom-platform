import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// A custom Floating Action Button with a gradient background.
class AppFAB extends StatelessWidget {
  const AppFAB({required this.onPressed, required this.icon, super.key});

  /// The callback when the button is pressed.
  final VoidCallback onPressed;

  /// The icon for the button.
  final Widget icon;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 58,
        height: 58,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.softOrange, Color(0xFFFF8C5A)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.softOrange.withValues(alpha: 0.4),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Center(
          child: IconTheme(
            data: const IconThemeData(color: Colors.white, size: 26),
            child: icon,
          ),
        ),
      ),
    );
  }
}
