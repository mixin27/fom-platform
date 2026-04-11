import "package:flutter/material.dart";

import "../tokens/app_colors.dart";

class AppComparisonMetricCard extends StatelessWidget {
  const AppComparisonMetricCard({
    required this.title,
    required this.value,
    required this.deltaText,
    required this.deltaColor,
    required this.progress,
    required this.progressColor,
    super.key,
  });

  final String title;
  final String value;
  final String deltaText;
  final Color deltaColor;
  final double progress;
  final Color progressColor;

  @override
  Widget build(BuildContext context) {
    final normalizedProgress = progress.clamp(0, 1).toDouble();

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: AppColors.textLight,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            deltaText,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: deltaColor,
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              minHeight: 4,
              value: normalizedProgress,
              backgroundColor: AppColors.border,
              valueColor: AlwaysStoppedAnimation<Color>(progressColor),
            ),
          ),
        ],
      ),
    );
  }
}
