import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

import '../widgets/reports_widgets.dart';

class ReportsHomePage extends StatefulWidget {
  const ReportsHomePage({super.key});

  @override
  State<ReportsHomePage> createState() => _ReportsHomePageState();
}

enum ReportPeriod { daily, weekly, monthly }

class _ReportsHomePageState extends State<ReportsHomePage> {
  ReportPeriod _selectedPeriod = ReportPeriod.daily;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                child: _selectedPeriod == ReportPeriod.daily
                    ? const _DailyReportView()
                    : const _WeeklyReportView(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.only(left: 20, right: 20, bottom: 16),
      decoration: const BoxDecoration(
        color: AppColors.warmWhite,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 1.5)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _selectedPeriod == ReportPeriod.daily
                        ? '📊 Daily Report'
                        : '📊 Weekly Report',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    _selectedPeriod == ReportPeriod.daily
                        ? 'နေ့စဉ်အစီရင်ခံစာ'
                        : 'အပတ်အစီရင်ခံစာ',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textLight,
                    ),
                  ),
                ],
              ),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.softOrangeLight,
                  border: Border.all(
                    color: AppColors.softOrangeMid,
                    width: 1.5,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    const Text('📤 ', style: TextStyle(fontSize: 12)),
                    Text(
                      _selectedPeriod == ReportPeriod.daily
                          ? 'Share'
                          : 'Export',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.softOrange,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Toggle between views
          Container(
            decoration: BoxDecoration(
              color: AppColors.background, // fallback map for segmented control
              borderRadius: BorderRadius.circular(14),
            ),
            padding: const EdgeInsets.all(4),
            child: Row(
              children: [
                _PeriodToggleBtn(
                  label: 'Day',
                  isSelected: _selectedPeriod == ReportPeriod.daily,
                  onTap: () =>
                      setState(() => _selectedPeriod = ReportPeriod.daily),
                ),
                _PeriodToggleBtn(
                  label: 'Week',
                  isSelected: _selectedPeriod == ReportPeriod.weekly,
                  onTap: () =>
                      setState(() => _selectedPeriod = ReportPeriod.weekly),
                ),
                _PeriodToggleBtn(
                  label: 'Month',
                  isSelected: _selectedPeriod == ReportPeriod.monthly,
                  onTap: () =>
                      setState(() => _selectedPeriod = ReportPeriod.monthly),
                ),
              ],
            ),
          ),
          // Day navigation (Only in Daily view logically, putting it here for UI completeness)
          if (_selectedPeriod == ReportPeriod.daily) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _NavBtn(icon: Icons.chevron_left_rounded, onTap: () {}),
                const Column(
                  children: [
                    Text(
                      'Thursday, April 2',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textDark,
                      ),
                    ),
                    Text(
                      'Today · 12 orders so far',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textLight,
                      ),
                    ),
                  ],
                ),
                _NavBtn(
                  icon: Icons.chevron_right_rounded,
                  onTap: () {},
                  disabled: true,
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _PeriodToggleBtn extends StatelessWidget {
  const _PeriodToggleBtn({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.softOrange : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: isSelected
                ? null
                : Border.all(color: AppColors.border, width: 2),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: isSelected ? Colors.white : AppColors.textLight,
            ),
          ),
        ),
      ),
    );
  }
}

class _NavBtn extends StatelessWidget {
  const _NavBtn({
    required this.icon,
    required this.onTap,
    this.disabled = false,
  });
  final IconData icon;
  final VoidCallback onTap;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Opacity(
        opacity: disabled ? 0.3 : 1.0,
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border, width: 1.5),
          ),
          alignment: Alignment.center,
          child: Icon(icon, size: 16, color: AppColors.textDark),
        ),
      ),
    );
  }
}

// === Daily View Tab ===
class _DailyReportView extends StatelessWidget {
  const _DailyReportView();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const RevenueHeroCard(
          title: "Today's Revenue",
          titleMm: 'ယနေ့ ဝင်ငွေ',
          amount: '485,000',
          changeText: '↑ +72,000 MMK vs yesterday',
          ordersCount: '23',
          customersCount: '18',
          avgOrder: '21K',
        ),

        const DashboardSectionHeader(
          icon: '📌',
          iconBgColor: AppColors.softOrangeLight,
          title: 'Order Status',
        ),
        const StatusBreakdownGrid(),

        const DashboardSectionHeader(
          icon: '📈',
          iconBgColor: AppColors.tealLight,
          title: 'Orders by Hour',
        ),
        const AppBarChart(
          title: 'Peak',
          subtitle: '10AM–12PM · 8 orders',
          titleColor: AppColors.textLight,
          data: [
            AppBarChartData(
              label: '8',
              valueLabel: '1',
              value: 1,
              color: AppColors.softOrangeMid,
            ),
            AppBarChartData(
              label: '9',
              valueLabel: '3',
              value: 3,
              color: AppColors.softOrange,
            ),
            AppBarChartData(
              label: '10',
              valueLabel: '5',
              value: 5,
              color: AppColors.softOrange,
            ),
            AppBarChartData(
              label: '11',
              valueLabel: '3',
              value: 3,
              color: AppColors.softOrange,
            ),
            AppBarChartData(
              label: '12',
              valueLabel: '4',
              value: 4,
              color: AppColors.softOrangeMid,
            ),
            AppBarChartData(
              label: '1P',
              valueLabel: '2',
              value: 2,
              color: AppColors.softOrangeMid,
            ),
            AppBarChartData(
              label: '2P',
              valueLabel: '3',
              value: 3,
              color: AppColors.softOrange,
            ),
            AppBarChartData(
              label: '3P',
              valueLabel: '1',
              value: 1,
              color: AppColors.softOrangeMid,
            ),
            AppBarChartData(
              label: '4P',
              valueLabel: '1',
              value: 1,
              color: AppColors.border,
            ),
          ],
        ),

        const SizedBox(height: 10),
        DashboardSectionHeader(
          icon: '🏆',
          iconBgColor: AppColors.purpleLight,
          title: 'Top Products',
          actionLabel: 'See all',
          onActionPressed: () {},
        ),
        const TopProductsList(),

        const SizedBox(height: 10),
        DashboardSectionHeader(
          icon: '⏱',
          iconBgColor: AppColors.yellowLight,
          title: 'Recent Orders',
          actionLabel: 'View all',
          onActionPressed: () {},
        ),
        const RecentOrdersMiniList(),
      ],
    );
  }
}

// === Weekly View Tab ===
class _WeeklyReportView extends StatelessWidget {
  const _WeeklyReportView();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const RevenueHeroCard(
          title: 'This Week',
          titleMm: 'ဒီအပတ် ဝင်ငွေ',
          amount: '2,840,000',
          changeText: '↑ +18% vs last week',
          ordersCount: '118',
          customersCount: '89',
          avgOrder: '24K',
        ),

        const DashboardSectionHeader(
          icon: '📈',
          iconBgColor: AppColors.tealLight,
          title: 'Revenue by Day',
        ),
        const AppBarChart(
          title: 'Best day',
          subtitle: 'Wednesday · 520K MMK',
          titleColor: AppColors.textLight,
          data: [
            AppBarChartData(
              label: 'Mon',
              valueLabel: '320K',
              value: 320,
              color: AppColors.softOrangeMid,
            ),
            AppBarChartData(
              label: 'Tue',
              valueLabel: '410K',
              value: 410,
              color: AppColors.softOrangeMid,
            ),
            AppBarChartData(
              label: 'Wed',
              valueLabel: '520K',
              value: 520,
              color: AppColors.softOrange,
            ),
            AppBarChartData(
              label: 'Thu',
              valueLabel: '380K',
              value: 380,
              color: AppColors.softOrangeMid,
            ),
            AppBarChartData(
              label: 'Fri',
              valueLabel: '460K',
              value: 460,
              color: AppColors.softOrange,
            ),
            AppBarChartData(
              label: 'Sat',
              valueLabel: '265K',
              value: 265,
              color: AppColors.softOrangeMid,
            ),
            AppBarChartData(
              label: 'Today',
              valueLabel: '485K',
              value: 485,
              color: AppColors.softOrange,
              isHighlighted: true,
            ),
          ],
        ),

        const SizedBox(height: 10),
        const DashboardSectionHeader(
          icon: '⚖️',
          iconBgColor: AppColors.softOrangeLight,
          title: 'vs Last Week',
        ),
        const ComparisonCardsGrid(),

        const SizedBox(height: 10),
        DashboardSectionHeader(
          icon: '⭐',
          iconBgColor: AppColors.purpleLight,
          title: 'Top Customers',
          actionLabel: 'See all',
          onActionPressed: () {},
        ),
        const TopCustomersList(),
      ],
    );
  }
}
