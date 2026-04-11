import "package:flutter/material.dart";

import "../tokens/app_colors.dart";

class AppReportHeroStat {
  const AppReportHeroStat({required this.value, required this.label});

  final String value;
  final String label;
}

class AppReportHeroCard extends StatelessWidget {
  const AppReportHeroCard({
    required this.label,
    required this.amount,
    required this.currency,
    required this.deltaText,
    required this.deltaColor,
    required this.stats,
    super.key,
  });

  final String label;
  final String amount;
  final String currency;
  final String deltaText;
  final Color deltaColor;
  final List<AppReportHeroStat> stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1A2E), Color(0xFF2D2D4E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.softOrange.withValues(alpha: 0.32),
                    AppColors.softOrange.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -20,
            left: 20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.teal.withValues(alpha: 0.2),
                    AppColors.teal.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 22, 22, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Colors.white.withValues(alpha: 0.52),
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 8),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: amount,
                        style: const TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          height: 1.1,
                        ),
                      ),
                      TextSpan(
                        text: " $currency",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: Colors.white.withValues(alpha: 0.64),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  deltaText,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: deltaColor,
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.only(top: 16),
                  decoration: BoxDecoration(
                    border: Border(
                      top: BorderSide(
                        color: Colors.white.withValues(alpha: 0.1),
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      for (var index = 0; index < stats.length; index++) ...[
                        Expanded(child: _HeroStat(stat: stats[index])),
                        if (index < stats.length - 1)
                          Container(
                            width: 1,
                            height: 30,
                            color: Colors.white.withValues(alpha: 0.1),
                          ),
                      ],
                    ],
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

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.stat});

  final AppReportHeroStat stat;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          stat.value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          stat.label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Colors.white.withValues(alpha: 0.52),
          ),
        ),
      ],
    );
  }
}
