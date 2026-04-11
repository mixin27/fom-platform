import 'package:flutter/material.dart';

import '../tokens/app_colors.dart';

class AppInfoRowItem {
  const AppInfoRowItem({
    required this.keyLabel,
    required this.valueLabel,
    this.valueColor = AppColors.textDark,
    this.valueFontSize = 13,
    this.valueFontWeight = FontWeight.w800,
  });

  final String keyLabel;
  final String valueLabel;
  final Color valueColor;
  final double valueFontSize;
  final FontWeight valueFontWeight;
}

class AppInfoRowsCard extends StatelessWidget {
  const AppInfoRowsCard({
    required this.icon,
    required this.iconBackgroundColor,
    required this.title,
    required this.rows,
    super.key,
    this.actionLabel,
    this.onActionTap,
  });

  final IconData icon;
  final Color iconBackgroundColor;
  final String title;
  final List<AppInfoRowItem> rows;
  final String? actionLabel;
  final VoidCallback? onActionTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: iconBackgroundColor,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, size: 16, color: AppColors.textDark),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                    fontSize: 13,
                  ),
                ),
              ),
              if (actionLabel != null)
                GestureDetector(
                  onTap: onActionTap,
                  child: Text(
                    actionLabel!,
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.softOrange,
                      fontSize: 11,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          ...rows.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final isLast = index == rows.length - 1;

            return Container(
              padding: EdgeInsets.only(top: 4, bottom: isLast ? 0 : 8),
              margin: EdgeInsets.only(bottom: isLast ? 0 : 8),
              decoration: BoxDecoration(
                border: isLast
                    ? null
                    : const Border(
                        bottom: BorderSide(color: AppColors.border, width: 1),
                      ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    item.keyLabel.toUpperCase(),
                    style: theme.textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.textLight,
                      fontSize: 11,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Flexible(
                    child: Text(
                      item.valueLabel,
                      textAlign: TextAlign.right,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        fontWeight: item.valueFontWeight,
                        color: item.valueColor,
                        fontSize: item.valueFontSize,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
