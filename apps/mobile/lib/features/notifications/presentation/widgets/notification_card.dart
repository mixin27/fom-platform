import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

enum NotificationStatusType {
  standard,
  orange,
  teal,
  green,
  yellow,
  purple,
  red,
}

class NotificationCard extends StatelessWidget {
  const NotificationCard({
    required this.title,
    required this.body,
    required this.timeLabel,
    required this.icon,
    super.key,
    this.statusType = NotificationStatusType.standard,
    this.isUnread = false,
    this.onTap,
  });

  final String title;
  final String body;
  final String timeLabel;
  final Widget icon;
  final NotificationStatusType statusType;
  final bool isUnread;
  final VoidCallback? onTap;

  Color _getPrimaryColor() {
    switch (statusType) {
      case NotificationStatusType.orange:
        return AppColors.softOrange;
      case NotificationStatusType.teal:
        return AppColors.teal;
      case NotificationStatusType.green:
        return AppColors.green;
      case NotificationStatusType.yellow:
        return AppColors.yellow;
      case NotificationStatusType.purple:
        return AppColors.purple;
      case NotificationStatusType.red:
        return const Color(0xFFEF4444);
      case NotificationStatusType.standard:
        return AppColors.softOrange;
    }
  }

  Color _getLightColor() {
    switch (statusType) {
      case NotificationStatusType.orange:
        return AppColors.softOrangeLight;
      case NotificationStatusType.teal:
        return AppColors.tealLight;
      case NotificationStatusType.green:
        return AppColors.greenLight;
      case NotificationStatusType.yellow:
        return AppColors.yellowLight;
      case NotificationStatusType.purple:
        return AppColors.purpleLight;
      case NotificationStatusType.red:
        return const Color(0xFFFEE2E2);
      case NotificationStatusType.standard:
        return AppColors.softOrangeLight;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = _getPrimaryColor();
    final lightColor = _getLightColor();

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: EdgeInsets.only(
          left: isUnread ? 13 : 16,
          right: 16,
          top: 14,
          bottom: 14,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border, width: 1.5),
        ),
        child: IntrinsicHeight(
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Unread left border line
              if (isUnread)
                Positioned(
                  left: -13, // align with outer generic padding representation
                  top: -14,
                  bottom: -14,
                  child: Container(
                    width: 4,
                    decoration: BoxDecoration(
                      color: primaryColor,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        bottomLeft: Radius.circular(16),
                      ),
                    ),
                  ),
                ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: lightColor,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: IconTheme(
                      data: IconThemeData(color: primaryColor, size: 20),
                      child: icon,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            color: AppColors.textDark,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          body,
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textMid,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          timeLabel,
                          style: theme.textTheme.labelSmall?.copyWith(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              // Unread orange dot
              if (isUnread && statusType == NotificationStatusType.orange)
                Positioned(
                  right: 0,
                  top: 0,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.softOrange,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
