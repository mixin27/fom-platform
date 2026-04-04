import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

class CustomerProfileInfoRow {
  const CustomerProfileInfoRow({
    required this.keyLabel,
    required this.valueLabel,
    this.valueColor = AppColors.textDark,
    this.valueFontSize = 13,
  });

  final String keyLabel;
  final String valueLabel;
  final Color valueColor;
  final double valueFontSize;
}

class CustomerProfileInfoCard extends StatelessWidget {
  const CustomerProfileInfoCard({
    super.key,
    required this.icon,
    required this.iconBgColor,
    required this.title,
    required this.rows,
    this.actionLabel,
    this.onActionTap,
  });

  final String icon;
  final Color iconBgColor;
  final String title;
  final List<CustomerProfileInfoRow> rows;
  final String? actionLabel;
  final VoidCallback? onActionTap;

  @override
  Widget build(BuildContext context) {
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
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(9),
                ),
                alignment: Alignment.center,
                child: Text(icon, style: const TextStyle(fontSize: 14)),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextTheme.of(context).bodyLarge?.copyWith(
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
                    style: TextTheme.of(context).labelSmall?.copyWith(
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
            final isLast = entry.key == rows.length - 1;
            final rowData = entry.value;

            return Container(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 8, top: 4),
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
                    rowData.keyLabel.toUpperCase(),
                    style: TextTheme.of(context).labelSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppColors.textLight,
                      fontSize: 11,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Flexible(
                    child: Text(
                      rowData.valueLabel,
                      style: TextTheme.of(context).bodyLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: rowData.valueColor,
                        fontSize: rowData.valueFontSize,
                      ),
                      textAlign: TextAlign.right,
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
