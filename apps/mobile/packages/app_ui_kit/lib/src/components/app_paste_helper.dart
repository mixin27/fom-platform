import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// A stylized dashed component for auto-filling forms from messenger.
class AppPasteHelper extends StatelessWidget {
  const AppPasteHelper({
    required this.onTap,
    this.title = 'Paste from Messenger',
    this.subtitle = 'Copy customer message → tap here to auto-fill fields',
    this.isSuccessful = false,
    super.key,
  });

  /// The primary title for the helper.
  final String title;

  /// Optional subtitle.
  final String subtitle;

  /// Callback when the helper is tapped.
  final VoidCallback onTap;

  /// Whether the paste was successful (e.g., changes colors and icon).
  final bool isSuccessful;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Dynamic colors based on state.
    final baseColor = isSuccessful ? AppColors.teal : AppColors.softOrange;
    final backgroundColor = isSuccessful
        ? AppColors.tealLight
        : AppColors.softOrange.withValues(alpha: 0.05);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: backgroundColor,
          border: Border.all(
            color: baseColor.withValues(alpha: 0.3),
            width: 2,
            style:
                BorderStyle.solid, // Custom paint would be needed for dashed.
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: baseColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isSuccessful
                    ? Icons.check_rounded
                    : Icons.content_paste_outlined,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: baseColor,
                      fontWeight: FontWeight.w900,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.textMid,
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, color: baseColor, size: 14),
          ],
        ),
      ),
    );
  }
}
