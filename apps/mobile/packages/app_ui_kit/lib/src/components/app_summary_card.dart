import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';

/// A compact summary card for dashboard stats.
class AppSummaryCard extends StatelessWidget {
  const AppSummaryCard({
    required this.label,
    required this.value,
    super.key,
    this.changeText,
    this.isPositiveChange = true,
  });

  /// The label for the summary (e.g., "Today Orders").
  final String label;

  /// The value to display (e.g., "23").
  final String value;

  /// Optional change text (e.g., "↑ 4 from yesterday").
  final String? changeText;

  /// Whether the change is positive (green) or neutral/negative (light color).
  final bool isPositiveChange;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusMd),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label.toUpperCase(),
            style: theme.textTheme.labelSmall?.copyWith(
              color: AppColors.textLight,
              fontWeight: FontWeight.w800,
              fontSize: 10,
              letterSpacing: 0.06,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: AppColors.textDark,
              fontWeight: FontWeight.w900,
              fontSize: 20,
            ),
          ),
          if (changeText != null) ...[
            const SizedBox(height: 2),
            Text(
              changeText!,
              style: theme.textTheme.labelSmall?.copyWith(
                color: isPositiveChange
                    ? const Color(0xFF22C55E)
                    : const Color(0xFFF59E0B),
                fontWeight: FontWeight.w700,
                fontSize: 10,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
