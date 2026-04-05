import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

class DashboardSectionHeader extends StatelessWidget {
  const DashboardSectionHeader({
    required this.icon,
    required this.title,
    required this.iconBgColor,
    this.actionLabel,
    this.onActionPressed,
    super.key,
  });

  final String icon;
  final String title;
  final Color iconBgColor;
  final String? actionLabel;
  final VoidCallback? onActionPressed;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textDark,
                ),
              ),
            ],
          ),
          if (actionLabel != null && onActionPressed != null)
            GestureDetector(
              onTap: onActionPressed,
              child: Text(
                actionLabel!,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppColors.softOrange,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class RevenueHeroCard extends StatelessWidget {
  const RevenueHeroCard({
    required this.title,
    required this.titleMm,
    required this.amount,
    required this.changeText,
    required this.ordersCount,
    required this.customersCount,
    required this.avgOrder,
    super.key,
  });

  final String title;
  final String titleMm;
  final String amount;
  final String changeText;
  final String ordersCount;
  final String customersCount;
  final String avgOrder;

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
          // Orange Glow Top Right
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
                    AppColors.softOrange.withValues(alpha: 0.3),
                    AppColors.softOrange.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          // Teal Glow Bottom Left
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
                    AppColors.teal.withValues(alpha: 0.0),
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
                  '$title — $titleMm'.toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: Colors.white.withValues(alpha: 0.5),
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
                        text: ' MMK',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: Colors.white.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  changeText,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF4ADE80), // Green for positive
                  ),
                ),
                const SizedBox(height: 20),

                // Stats Row
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
                      Expanded(
                        child: _StatItem(value: ordersCount, label: 'Orders'),
                      ),
                      Container(
                        width: 1,
                        height: 30,
                        color: Colors.white.withValues(alpha: 0.1),
                      ),
                      Expanded(
                        child: _StatItem(
                          value: customersCount,
                          label: 'Customers',
                        ),
                      ),
                      Container(
                        width: 1,
                        height: 30,
                        color: Colors.white.withValues(alpha: 0.1),
                      ),
                      Expanded(
                        child: _StatItem(value: avgOrder, label: 'Avg Order'),
                      ),
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

class _StatItem extends StatelessWidget {
  const _StatItem({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Colors.white.withValues(alpha: 0.5),
          ),
        ),
      ],
    );
  }
}

class StatusBreakdownGrid extends StatelessWidget {
  const StatusBreakdownGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 2.2, // To roughly match design (wide cards)
      children: const [
        _BreakdownCard(
          icon: '🆕',
          iconBgColor: AppColors.softOrangeLight,
          value: '4',
          valueColor: AppColors.softOrange,
          label: 'NEW',
        ),
        _BreakdownCard(
          icon: '✅',
          iconBgColor: AppColors.tealLight,
          value: '6',
          valueColor: AppColors.teal,
          label: 'CONFIRMED',
        ),
        _BreakdownCard(
          icon: '🚚',
          iconBgColor: AppColors.yellowLight,
          value: '2',
          valueColor: AppColors.yellow,
          label: 'SHIPPING',
        ),
        _BreakdownCard(
          icon: '🎉',
          iconBgColor: AppColors.greenLight,
          value: '11',
          valueColor: AppColors.green,
          label: 'DELIVERED',
        ),
      ],
    );
  }
}

class _BreakdownCard extends StatelessWidget {
  const _BreakdownCard({
    required this.icon,
    required this.iconBgColor,
    required this.value,
    required this.valueColor,
    required this.label,
  });

  final String icon;
  final Color iconBgColor;
  final String value;
  final Color valueColor;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(14),
            ),
            alignment: Alignment.center,
            child: Text(icon, style: const TextStyle(fontSize: 20)),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: valueColor,
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textLight,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class MiniBarChart extends StatelessWidget {
  const MiniBarChart({
    required this.title,
    required this.titleColor,
    required this.subtitle,
    required this.data,
    super.key,
  });

  final String title;
  final Color titleColor;
  final String subtitle;
  final List<BarData> data;

  @override
  Widget build(BuildContext context) {
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
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textLight,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 80, // or 100 for week
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: data.map((d) => _BarGroup(data: d)).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class BarData {
  const BarData({
    required this.label,
    required this.valueLabel,
    required this.heightFactor,
    required this.color,
    this.isToday = false,
  });

  final String label;
  final String valueLabel;
  final double heightFactor; // 0.0 to 1.0
  final Color color;
  final bool isToday;
}

class _BarGroup extends StatelessWidget {
  const _BarGroup({required this.data});
  final BarData data;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Text(
            data.valueLabel,
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w900,
              color: AppColors.textMid,
            ),
          ),
          const SizedBox(height: 2),
          Container(
            height: 60 * data.heightFactor, // Max height roughly 60
            width: double.infinity,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              color: data.color,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(6),
              ),
              border: data.isToday
                  ? Border.all(
                      color: const Color(0xFFC14A1A),
                      width: 2,
                      strokeAlign: BorderSide.strokeAlignOutside,
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            data.label,
            maxLines: 1,
            style: TextStyle(
              fontSize: 9,
              fontWeight: data.isToday ? FontWeight.w900 : FontWeight.w800,
              color: data.isToday ? AppColors.softOrange : AppColors.textLight,
            ),
          ),
        ],
      ),
    );
  }
}

// ==== Lists ====

class TopProductsList extends StatelessWidget {
  const TopProductsList({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      padding: const EdgeInsets.all(16),
      child: const Column(
        children: [
          _ProductRow(
            rank: '1',
            rankBg: Color(0xFFFEF3C7),
            rankColor: Color(0xFFD97706),
            name: '👗 Silk Longyi Set',
            percentage: 0.85,
            barColor: AppColors.softOrange,
            qty: '×14 sold',
            rev: '252,000 MMK',
          ),
          Divider(height: 20, color: AppColors.border),
          _ProductRow(
            rank: '2',
            rankBg: Color(0xFFF1F5F9),
            rankColor: Color(0xFF64748B),
            name: '👜 Handbag (Black)',
            percentage: 0.55,
            barColor: AppColors.teal,
            qty: '×6 sold',
            rev: '192,000 MMK',
          ),
          Divider(height: 20, color: AppColors.border),
          _ProductRow(
            rank: '3',
            rankBg: Color(0xFFFEF2E8),
            rankColor: Color(0xFF92400E),
            name: '👔 Men Shirt (L)',
            percentage: 0.25,
            barColor: AppColors.yellow,
            qty: '×3 sold',
            rev: '55,500 MMK',
          ),
        ],
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  const _ProductRow({
    required this.rank,
    required this.rankBg,
    required this.rankColor,
    required this.name,
    required this.percentage,
    required this.barColor,
    required this.qty,
    required this.rev,
  });
  final String rank;
  final Color rankBg;
  final Color rankColor;
  final String name;
  final double percentage;
  final Color barColor;
  final String qty;
  final String rev;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: rankBg,
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Text(
            rank,
            style: TextStyle(
              color: rankColor,
              fontSize: 11,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
                alignment: Alignment.centerLeft,
                child: FractionallySizedBox(
                  widthFactor: percentage,
                  child: Container(
                    decoration: BoxDecoration(
                      color: barColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              qty,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: AppColors.textDark,
              ),
            ),
            Text(
              rev,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: AppColors.textLight,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class RecentOrdersMiniList extends StatelessWidget {
  const RecentOrdersMiniList({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      padding: const EdgeInsets.all(16),
      child: const Column(
        children: [
          _MiniOrderRow(
            avatar: '👩',
            name: 'Daw Khin Myat',
            product: 'Silk Longyi × 2 · 10:32 AM',
            price: '39,000',
            badgeLabel: 'NEW',
            badgeColor: AppColors.softOrange,
            badgeBg: AppColors.softOrangeLight,
          ),
          Divider(height: 20, color: AppColors.border),
          _MiniOrderRow(
            avatar: '👨',
            name: 'Ko Zaw Lin',
            product: 'Men Shirt × 1 · 9:14 AM',
            price: '21,500',
            badgeLabel: 'SHIPPING',
            badgeColor: AppColors.yellow,
            badgeBg: AppColors.yellowLight,
          ),
          Divider(height: 20, color: AppColors.border),
          _MiniOrderRow(
            avatar: '👩',
            name: 'Ma Thin Zar',
            product: 'Handbag × 1 · 8:50 AM',
            price: '35,000',
            badgeLabel: 'DELIVERED',
            badgeColor: AppColors.green,
            badgeBg: AppColors.greenLight,
          ),
        ],
      ),
    );
  }
}

class _MiniOrderRow extends StatelessWidget {
  const _MiniOrderRow({
    required this.avatar,
    required this.name,
    required this.product,
    required this.price,
    required this.badgeLabel,
    required this.badgeColor,
    required this.badgeBg,
  });
  final String avatar;
  final String name;
  final String product;
  final String price;
  final String badgeLabel;
  final Color badgeColor;
  final Color badgeBg;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.softOrangeLight,
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Text(avatar, style: const TextStyle(fontSize: 14)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textDark,
                ),
              ),
              Text(
                product,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textLight,
                ),
              ),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              price,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              margin: const EdgeInsets.only(top: 2),
              decoration: BoxDecoration(
                color: badgeBg,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                badgeLabel,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  color: badgeColor,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ==== Weekly View Widgets ====
class ComparisonCardsGrid extends StatelessWidget {
  const ComparisonCardsGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.6,
      children: const [
        _CompareCard(
          title: 'REVENUE',
          value: '2.84M',
          change: '↑ +432K',
          changeColor: AppColors.green,
          barPercentage: 0.72,
          barColor: AppColors.green,
        ),
        _CompareCard(
          title: 'ORDERS',
          value: '118',
          change: '↑ +18 orders',
          changeColor: AppColors.green,
          barPercentage: 0.60,
          barColor: AppColors.teal,
        ),
        _CompareCard(
          title: 'DELIVER RATE',
          value: '91%',
          change: '↑ +3%',
          changeColor: AppColors.green,
          barPercentage: 0.91,
          barColor: AppColors.softOrange,
        ),
        _CompareCard(
          title: 'AVG ORDER',
          value: '24K',
          change: '→ same',
          changeColor: AppColors.yellow,
          barPercentage: 0.50,
          barColor: AppColors.yellow,
        ),
      ],
    );
  }
}

class _CompareCard extends StatelessWidget {
  const _CompareCard({
    required this.title,
    required this.value,
    required this.change,
    required this.changeColor,
    required this.barPercentage,
    required this.barColor,
  });

  final String title;
  final String value;
  final String change;
  final Color changeColor;
  final double barPercentage;
  final Color barColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.border, width: 1.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: AppColors.textLight,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: AppColors.textDark,
              height: 1.1,
            ),
          ),
          Text(
            change,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: changeColor,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
            alignment: Alignment.centerLeft,
            child: FractionallySizedBox(
              widthFactor: barPercentage,
              child: Container(
                decoration: BoxDecoration(
                  color: barColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class TopCustomersList extends StatelessWidget {
  const TopCustomersList({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      padding: const EdgeInsets.all(16),
      child: const Column(
        children: [
          _CustomerRow(
            medal: '🥇',
            medalBg: Color(0xFFFEF3C7),
            avatar: '👩',
            avatarBg: AppColors.softOrangeLight,
            name: 'Daw Aye Aye',
            subtitle: '8 orders this week',
            amount: '312K',
          ),
          Divider(height: 20, color: AppColors.border),
          _CustomerRow(
            medal: '🥈',
            medalBg: Color(0xFFF1F5F9),
            avatar: '👩',
            avatarBg: AppColors.border, // border is just greyish
            name: 'Ma Thin Zar',
            subtitle: '5 orders this week',
            amount: '185K',
          ),
        ],
      ),
    );
  }
}

class _CustomerRow extends StatelessWidget {
  const _CustomerRow({
    required this.medal,
    required this.medalBg,
    required this.avatar,
    required this.avatarBg,
    required this.name,
    required this.subtitle,
    required this.amount,
  });

  final String medal;
  final Color medalBg;
  final String avatar;
  final Color avatarBg;
  final String name;
  final String subtitle;
  final String amount;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: medalBg,
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Text(medal, style: const TextStyle(fontSize: 14)),
        ),
        const SizedBox(width: 8),
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: avatarBg,
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Text(avatar, style: const TextStyle(fontSize: 14)),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textDark,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textLight,
                ),
              ),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              amount,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: AppColors.softOrange,
              ),
            ),
            const Text(
              'MMK spent',
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w600,
                color: AppColors.textLight,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
