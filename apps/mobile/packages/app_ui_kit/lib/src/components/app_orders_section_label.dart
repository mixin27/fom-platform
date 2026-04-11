import "package:flutter/material.dart";

import "../tokens/app_colors.dart";

class AppOrdersSectionLabel extends StatelessWidget {
  const AppOrdersSectionLabel({
    required this.title,
    super.key,
    this.topPadding = 4,
  });

  final String title;
  final double topPadding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(top: topPadding, bottom: 8, left: 2, right: 2),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          fontWeight: FontWeight.w800,
          color: AppColors.textLight,
          fontSize: 11,
          letterSpacing: 1.1,
        ),
      ),
    );
  }
}
