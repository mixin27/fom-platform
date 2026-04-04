import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// A stylized header for form sections with an icon and translation.
class AppSectionHeader extends StatelessWidget {
  const AppSectionHeader({
    required this.icon,
    required this.title,
    super.key,
    this.subtitle,
    this.iconBackgroundColor,
    this.iconColor,
  });

  /// The icon to display on the left.
  final Widget icon;

  /// The primary title for the section.
  final String title;

  /// Optional subtitle, typically a Myanmar translation.
  final String? subtitle;

  /// Optional background color for the icon container.
  final Color? iconBackgroundColor;

  /// Optional color for the icon itself.
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color:
                  iconBackgroundColor ??
                  AppColors.softOrange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: IconTheme(
              data: IconThemeData(
                size: 16,
                color: iconColor ?? AppColors.softOrange,
              ),
              child: Center(child: icon),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: AppColors.textDark,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.04,
                  ),
                ),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'NotoSansMyanmar',
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
