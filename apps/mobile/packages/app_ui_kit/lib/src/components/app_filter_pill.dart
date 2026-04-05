import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

enum AppFilterPillStyle { standard, teal }

class AppFilterPill extends StatelessWidget {
  const AppFilterPill({
    required this.label,
    super.key,
    this.isSelected = false,
    this.style = AppFilterPillStyle.standard,
    this.onTap,
  });

  final String label;
  final bool isSelected;
  final AppFilterPillStyle style;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color borderColor;
    Color textColor;

    if (style == AppFilterPillStyle.teal) {
      backgroundColor = AppColors.tealLight;
      borderColor = AppColors.tealLight;
      textColor = AppColors.teal;
    } else if (isSelected) {
      backgroundColor = AppColors.softOrange;
      borderColor = AppColors.softOrange;
      textColor = Colors.white;
    } else {
      backgroundColor = Colors.white;
      borderColor = AppColors.border;
      textColor = AppColors.textLight;
    }

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: borderColor, width: 2),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: textColor,
            letterSpacing: 0.1,
          ),
        ),
      ),
    );
  }
}
