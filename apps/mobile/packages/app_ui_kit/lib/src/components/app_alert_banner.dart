import 'package:flutter/material.dart';

/// Contextual banners for alerts, warnings, or info.
class AppAlertBanner extends StatelessWidget {
  const AppAlertBanner({
    required this.title,
    super.key,
    this.message,
    this.icon = const Icon(
      Icons.warning_amber_rounded,
      size: 20,
      color: Color(0xFF92400E),
    ),
    this.backgroundColor = const Color(0xFFFEF3C7),
    this.borderColor = const Color(0xFFFDE68A),
    this.titleColor = const Color(0xFF92400E),
    this.messageColor = const Color(0xFFB45309),
  });

  /// The title for the alert.
  final String title;

  /// Optional message below the title.
  final String? message;

  /// Optional icon for the alert.
  final Widget icon;

  /// Background color of the banner.
  final Color backgroundColor;

  /// Border color of the banner.
  final Color borderColor;

  /// Text color for the title.
  final Color titleColor;

  /// Text color for the message.
  final Color messageColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: 1.5),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(padding: const EdgeInsets.only(top: 2), child: icon),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: titleColor,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
                if (message != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    message!,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: messageColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
