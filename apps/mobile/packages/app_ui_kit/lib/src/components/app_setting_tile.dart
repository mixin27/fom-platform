import 'package:flutter/material.dart';

import '../tokens/app_colors.dart';

/// A group container that visually wraps a collection of settings tiles
class AppSettingGroup extends StatelessWidget {
  const AppSettingGroup({
    super.key,
    required this.children,
    this.marginBottom = 14.0,
  });

  /// The tiles to display inside the group.
  final List<Widget> children;

  /// External bottom margin.
  final double marginBottom;

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) return const SizedBox.shrink();

    // Inject dividers between children
    final List<Widget> dividedChildren = [];
    for (int i = 0; i < children.length; i++) {
      dividedChildren.add(children[i]);
      if (i < children.length - 1) {
        dividedChildren.add(
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Divider(height: 1, thickness: 1, color: AppColors.border),
          ),
        );
      }
    }

    return Container(
      margin: EdgeInsets.only(bottom: marginBottom),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: dividedChildren,
      ),
    );
  }
}

/// A standard configuration tile for the settings/profile screen.
class AppSettingTile extends StatelessWidget {
  const AppSettingTile({
    super.key,
    required this.title,
    this.subtitle,
    this.iconEmoji,
    this.iconBgColor,
    this.trailingValue,
    this.trailingWidget,
    this.showArrow = false,
    this.onTap,
    this.titleColor = AppColors.textDark,
  });

  /// The main title of the setting.
  final String title;

  /// Optional sub-description.
  final String? subtitle;

  /// Emoji or text based icon character to show in the leading box.
  final String? iconEmoji;

  /// Background color of the leading icon box. Defaults to greyish if null.
  final Color? iconBgColor;

  /// Specific text value to show on the trailing edge (e.g., "English").
  final String? trailingValue;

  /// A raw widget to show on the trailing edge (e.g., a toggle switch).
  final Widget? trailingWidget;

  /// Whether to render a chevron right arrow.
  final bool showArrow;

  /// Custom override for title color (e.g., Red for "Log Out").
  final Color titleColor;

  /// Action when tapped.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              // Lead icon box
              if (iconEmoji != null) ...[
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: iconBgColor ?? const Color(0xFFE8E8F0),
                    borderRadius: BorderRadius.circular(11),
                  ),
                  alignment: Alignment.center,
                  child: Text(iconEmoji!, style: const TextStyle(fontSize: 17)),
                ),
                const SizedBox(width: 12),
              ],

              // Middle text cluster
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: titleColor,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 1),
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textLight,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Right side items
              if (trailingValue != null ||
                  trailingWidget != null ||
                  showArrow) ...[
                const SizedBox(width: 12),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (trailingValue != null)
                      Text(
                        trailingValue!,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textMid,
                        ),
                      ),
                    if (trailingWidget != null) ...[
                      if (trailingValue != null) const SizedBox(width: 6),
                      trailingWidget!,
                    ],
                    if (showArrow) ...[
                      if (trailingValue != null || trailingWidget != null)
                        const SizedBox(width: 6),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: AppColors.textLight,
                        size: 20,
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
