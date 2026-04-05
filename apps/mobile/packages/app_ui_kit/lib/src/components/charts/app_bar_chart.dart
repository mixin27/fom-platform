import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../tokens/app_colors.dart';

/// A data model representing a single bar in the [AppBarChart].
class AppBarChartData {
  const AppBarChartData({
    required this.label,
    required this.value,
    this.valueLabel,
    required this.color,
    this.isHighlighted = false,
  });

  /// The label to display on the X-axis below the bar.
  final String label;

  /// The exact numerical value determining the height of the bar.
  final double value;

  /// An optional string to show as a tooltip or top title above the bar
  /// (e.g. "320K"). If null, [value] is formatted automatically.
  final String? valueLabel;

  /// The main color of the bar.
  final Color color;

  /// Whether this bar should be highlighted (e.g., to signify "Today").
  final bool isHighlighted;
}

/// A highly reusable and styled Bar Chart component built on top of `fl_chart`.
class AppBarChart extends StatelessWidget {
  const AppBarChart({
    super.key,
    required this.title,
    required this.subtitle,
    required this.data,
    this.titleColor = AppColors.textLight,
  });

  final String title;
  final String subtitle;
  final Color titleColor;
  final List<AppBarChartData> data;

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) return const SizedBox.shrink();

    // Determine the max Y value for scaling the chart effectively
    final maxY = data.map((e) => e.value).reduce((a, b) => a > b ? a : b);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$title · $subtitle',
            style: TextStyle(
              fontSize: 11,
              color: titleColor,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 100,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceEvenly,
                maxY: maxY * 1.2, // Give space for top labels
                barTouchData: BarTouchData(
                  enabled: true,
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => AppColors.textDark,
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      final item = data[group.x.toInt()];
                      return BarTooltipItem(
                        item.valueLabel ?? item.value.toStringAsFixed(0),
                        const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  // Disable grid titles
                  leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),

                  // Top titles for the specific value label (e.g. "320K" or "1")
                  topTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (double value, TitleMeta meta) {
                        final item = data[value.toInt()];
                        return SideTitleWidget(
                          meta: meta,
                          space: 4,
                          child: Text(
                            item.valueLabel ?? item.value.toStringAsFixed(0),
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textMid,
                            ),
                          ),
                        );
                      },
                      reservedSize: 20,
                    ),
                  ),

                  // Bottom titles for the X-axis label (e.g. "Mon")
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (double value, TitleMeta meta) {
                        final item = data[value.toInt()];
                        return SideTitleWidget(
                          meta: meta,
                          space: 4,
                          child: Text(
                            item.label,
                            maxLines: 1,
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: item.isHighlighted
                                  ? FontWeight.w900
                                  : FontWeight.w800,
                              color: item.isHighlighted
                                  ? AppColors.softOrange
                                  : AppColors.textLight,
                            ),
                          ),
                        );
                      },
                      reservedSize: 22,
                    ),
                  ),
                ),
                gridData: const FlGridData(show: false),
                borderData: FlBorderData(show: false),
                barGroups: data.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;

                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: item.value,
                        color: item.color,
                        width: 16,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(6),
                        ),
                        borderSide: item.isHighlighted
                            ? const BorderSide(
                                color: Color(0xFFC14A1A),
                                width: 2,
                              )
                            : const BorderSide(
                                color: Colors.transparent,
                                width: 0,
                              ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
