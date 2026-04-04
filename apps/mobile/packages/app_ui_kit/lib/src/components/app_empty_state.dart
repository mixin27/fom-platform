import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// A component for displaying empty lists or no-results states.
class AppEmptyState extends StatelessWidget {
  const AppEmptyState({
    required this.icon,
    required this.title,
    super.key,
    this.message,
    this.action,
  });

  /// Large icon or emoji.
  final Widget icon;

  /// Bold title for the empty state.
  final String title;

  /// Optional descriptive message.
  final String? message;

  /// Optional action widget (e.g., a "Create Order" button).
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 60),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Opacity(
              opacity: 0.6,
              child: IconTheme(
                data: const IconThemeData(size: 64, color: AppColors.textLight),
                child: icon,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleMedium?.copyWith(
                color: AppColors.textMid,
                fontWeight: FontWeight.w800,
                fontSize: 16,
              ),
            ),
            if (message != null) ...[
              const SizedBox(height: 8),
              Text(
                message!,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.textLight,
                  fontWeight: FontWeight.w600,
                  height: 1.5,
                ),
              ),
            ],
            if (action != null) ...[const SizedBox(height: 24), action!],
          ],
        ),
      ),
    );
  }
}
