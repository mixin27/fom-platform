import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// Supported timeline event colors.
enum AppTimelineColor { orange, teal, gray }

/// A single item in the activity timeline.
class AppTimelineItem extends StatelessWidget {
  const AppTimelineItem({
    required this.time,
    required this.event,
    super.key,
    this.subtitle,
    this.color = AppTimelineColor.gray,
    this.isLast = false,
  });

  /// The time the event occurred.
  final String time;

  /// The main event title.
  final String event;

  /// Optional subtitle or detail.
  final String? subtitle;

  /// The color of the timeline marker.
  final AppTimelineColor color;

  /// Whether this is the last item in the timeline.
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    Color dotColor;
    Color shadowColor;

    switch (color) {
      case AppTimelineColor.orange:
        dotColor = AppColors.softOrange;
        shadowColor = AppColors.softOrangeMid;
        break;
      case AppTimelineColor.teal:
        dotColor = AppColors.teal;
        shadowColor = const Color(0xFFA8DDD9);
        break;
      case AppTimelineColor.gray:
        dotColor = AppColors.border;
        shadowColor = AppColors.border;
        break;
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Marker column
          SizedBox(
            width: 32,
            child: Column(
              children: [
                Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [BoxShadow(color: shadowColor, spreadRadius: 2)],
                  ),
                ),
                if (!isLast)
                  Expanded(child: Container(width: 2, color: AppColors.border)),
              ],
            ),
          ),

          // Content column
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    time,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textLight,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    event,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 1),
                    Text(
                      subtitle!,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textMid,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A vertical activity timeline component.
class AppTimeline extends StatelessWidget {
  const AppTimeline({required this.items, super.key});

  /// The list of items to display in the timeline.
  final List<AppTimelineItem> items;

  @override
  Widget build(BuildContext context) {
    return Column(children: items);
  }
}
