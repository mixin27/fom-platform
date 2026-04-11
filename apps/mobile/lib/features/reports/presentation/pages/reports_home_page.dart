import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:flutter_bloc/flutter_bloc.dart";
import "package:fom_mobile/app/di/injection_container.dart";
import "package:intl/intl.dart";

import "../../domain/entities/report_period.dart";
import "../../domain/entities/shop_report_snapshot.dart";
import "../bloc/reports_home_bloc.dart";
import "../bloc/reports_home_event.dart";
import "../bloc/reports_home_state.dart";
import "../widgets/reports_widgets.dart";

class ReportsHomePage extends StatelessWidget {
  const ReportsHomePage({
    super.key,
    required this.initialShopId,
    required this.initialShopName,
  });

  final String initialShopId;
  final String initialShopName;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<ReportsHomeBloc>.value(
      value: getIt<ReportsHomeBloc>(),
      child: _ReportsHomeView(
        initialShopId: initialShopId,
        initialShopName: initialShopName,
      ),
    );
  }
}

class _ReportsHomeView extends StatefulWidget {
  const _ReportsHomeView({
    required this.initialShopId,
    required this.initialShopName,
  });

  final String initialShopId;
  final String initialShopName;

  @override
  State<_ReportsHomeView> createState() => _ReportsHomeViewState();
}

class _ReportsHomeViewState extends State<_ReportsHomeView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportsHomeBloc>().add(
        ReportsHomeStarted(
          shopId: widget.initialShopId,
          shopName: widget.initialShopName,
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ReportsHomeBloc, ReportsHomeState>(
      listenWhen: (previous, current) {
        return previous.errorMessage != current.errorMessage &&
            current.errorMessage != null;
      },
      listener: (context, state) {
        final message = state.errorMessage;
        if (message == null || message.isEmpty) {
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
        );
        context.read<ReportsHomeBloc>().add(const ReportsHomeErrorDismissed());
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: AppColors.background,
          body: RefreshIndicator(
            onRefresh: () => _onRefresh(context),
            color: AppColors.softOrange,
            child: SafeArea(
              bottom: false,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: ReportsHeader(
                      selectedPeriod: state.selectedPeriod,
                      dateTitle: _dateTitle(state),
                      dateSubtitle: _dateSubtitle(state),
                      canNavigateNext: state.canNavigateNext,
                      onSharePressed: () => showReportsShareSheet(context),
                      onPeriodChanged: (period) {
                        context.read<ReportsHomeBloc>().add(
                          ReportsHomePeriodChanged(period),
                        );
                      },
                      onPreviousPressed: () {
                        context.read<ReportsHomeBloc>().add(
                          const ReportsHomePreviousRequested(),
                        );
                      },
                      onNextPressed: () {
                        context.read<ReportsHomeBloc>().add(
                          const ReportsHomeNextRequested(),
                        );
                      },
                    ),
                  ),
                  ..._buildContentSlivers(state),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  List<Widget> _buildContentSlivers(ReportsHomeState state) {
    final report = state.report;
    if (report == null) {
      if (state.status == ReportsHomeStatus.error) {
        return const [
          SliverFillRemaining(
            hasScrollBody: false,
            child: AppEmptyState(
              icon: Icon(Icons.bar_chart_outlined),
              title: "Unable to load reports",
              message: "Pull to refresh after checking your connection.",
            ),
          ),
        ];
      }

      return const [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(child: CircularProgressIndicator()),
        ),
      ];
    }

    final children = <Widget>[
      AppReportHeroCard(
        label: _heroLabel(state.selectedPeriod),
        amount: _formatCompact(report.totalRevenue),
        currency: "MMK",
        deltaText: _deltaText(state.selectedPeriod, report.revenueDelta),
        deltaColor: report.revenueDelta >= 0
            ? const Color(0xFF4ADE80)
            : const Color(0xFFFDA4AF),
        stats: <AppReportHeroStat>[
          AppReportHeroStat(value: "${report.totalOrders}", label: "Orders"),
          AppReportHeroStat(
            value: "${report.customerCount}",
            label: "Customers",
          ),
          AppReportHeroStat(
            value: _formatCompact(report.averageOrderValue),
            label: "Avg Order",
          ),
        ],
      ),
      const SizedBox(height: 14),
    ];

    if (state.selectedPeriod == ReportPeriod.daily) {
      children.addAll(_buildDailySections(report));
    } else {
      children.addAll(
        _buildPeriodSections(report, selectedPeriod: state.selectedPeriod),
      );
    }

    children.add(const SizedBox(height: 96));

    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        sliver: SliverList(delegate: SliverChildListDelegate(children)),
      ),
    ];
  }

  List<Widget> _buildDailySections(ShopReportSnapshot report) {
    final peak = report.hourlyBreakdown.fold<ReportHourlyBreakdownItem?>(null, (
      current,
      item,
    ) {
      if (current == null || item.orderCount > current.orderCount) {
        return item;
      }
      return current;
    });

    final hourlyBars = report.hourlyBreakdown
        .map((item) {
          final isPeak = peak != null && item.hour == peak.hour;
          return AppBarChartData(
            label: item.label,
            value: item.orderCount.toDouble(),
            valueLabel: "${item.orderCount}",
            color: isPeak ? AppColors.softOrange : AppColors.softOrangeMid,
            isHighlighted: isPeak,
          );
        })
        .toList(growable: false);

    return [
      const AppSectionHeader(
        icon: Icon(Icons.pie_chart_rounded),
        title: "Order Status",
        iconBackgroundColor: AppColors.softOrangeLight,
        iconColor: AppColors.softOrange,
      ),
      ReportsStatusBreakdownGrid(breakdown: report.statusBreakdown),
      const SizedBox(height: 12),
      const AppSectionHeader(
        icon: Icon(Icons.query_stats_rounded),
        title: "Orders by Hour",
        iconBackgroundColor: AppColors.tealLight,
        iconColor: AppColors.teal,
      ),
      if (hourlyBars.isEmpty)
        const AppEmptyState(
          icon: Icon(Icons.timeline_outlined),
          title: "No hourly activity",
          message: "Orders by hour will appear once orders are available.",
        )
      else
        AppBarChart(
          title: "Peak",
          subtitle: peak == null
              ? "No orders"
              : "${peak.label} · ${peak.orderCount} orders",
          data: hourlyBars,
          titleColor: AppColors.textLight,
        ),
      const SizedBox(height: 12),
      const AppSectionHeader(
        icon: Icon(Icons.inventory_2_rounded),
        title: "Top Products",
        iconBackgroundColor: AppColors.purpleLight,
        iconColor: AppColors.purple,
      ),
      ReportsTopProductsCard(products: report.topProducts),
      const SizedBox(height: 12),
      const AppSectionHeader(
        icon: Icon(Icons.receipt_long_rounded),
        title: "Recent Orders",
        iconBackgroundColor: AppColors.yellowLight,
        iconColor: AppColors.yellow,
      ),
      ReportsRecentOrdersCard(orders: report.recentOrders),
    ];
  }

  List<Widget> _buildPeriodSections(
    ShopReportSnapshot report, {
    required ReportPeriod selectedPeriod,
  }) {
    final maxRevenue = report.dailyBreakdown
        .map((item) => item.revenue)
        .fold<int>(0, (max, value) => value > max ? value : max);

    final dailyBars = report.dailyBreakdown
        .map((item) {
          final compactLabel = item.label.split(",").first.trim();
          final isBestDay = item.revenue == maxRevenue && item.revenue > 0;

          return AppBarChartData(
            label: compactLabel,
            value: item.revenue.toDouble(),
            valueLabel: _formatCompact(item.revenue),
            color: isBestDay ? AppColors.softOrange : AppColors.softOrangeMid,
            isHighlighted: isBestDay,
          );
        })
        .toList(growable: false);

    final comparisonCards = <Widget>[
      AppComparisonMetricCard(
        title: "Revenue",
        value: "${_formatCompact(report.totalRevenue)} MMK",
        deltaText: _deltaText(selectedPeriod, report.revenueDelta),
        deltaColor: report.revenueDelta >= 0
            ? AppColors.green
            : AppColors.softOrange,
        progress: report.totalOrders == 0
            ? 0
            : report.deliveredCount / report.totalOrders,
        progressColor: AppColors.green,
      ),
      AppComparisonMetricCard(
        title: "Orders",
        value: "${report.totalOrders}",
        deltaText: "${report.pendingCount} pending",
        deltaColor: AppColors.teal,
        progress: report.totalOrders == 0
            ? 0
            : report.deliveredCount / report.totalOrders,
        progressColor: AppColors.teal,
      ),
      AppComparisonMetricCard(
        title: "Deliver Rate",
        value: "${report.deliveredRate}%",
        deltaText: "${report.deliveredCount} delivered",
        deltaColor: AppColors.green,
        progress: report.deliveredRate / 100,
        progressColor: AppColors.softOrange,
      ),
      AppComparisonMetricCard(
        title: "Avg Order",
        value: "${_formatCompact(report.averageOrderValue)} MMK",
        deltaText: "${report.customerCount} customers",
        deltaColor: AppColors.yellow,
        progress: (report.averageOrderValue / 50000).clamp(0, 1).toDouble(),
        progressColor: AppColors.yellow,
      ),
    ];

    return [
      const AppSectionHeader(
        icon: Icon(Icons.stacked_bar_chart_rounded),
        title: "Revenue by Day",
        iconBackgroundColor: AppColors.tealLight,
        iconColor: AppColors.teal,
      ),
      if (dailyBars.isEmpty)
        const AppEmptyState(
          icon: Icon(Icons.query_stats_outlined),
          title: "No trend data",
          message: "Daily breakdown will appear once data is synced.",
        )
      else
        AppBarChart(
          title: "Best day",
          subtitle: _bestDaySubtitle(report),
          data: dailyBars,
          titleColor: AppColors.textLight,
        ),
      const SizedBox(height: 12),
      AppSectionHeader(
        icon: const Icon(Icons.compare_arrows_rounded),
        title: selectedPeriod == ReportPeriod.weekly
            ? "vs Last Week"
            : "vs Last Month",
        iconBackgroundColor: AppColors.softOrangeLight,
        iconColor: AppColors.softOrange,
      ),
      GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.15,
        children: comparisonCards,
      ),
      const SizedBox(height: 12),
      const AppSectionHeader(
        icon: Icon(Icons.star_rounded),
        title: "Top Customers",
        iconBackgroundColor: AppColors.purpleLight,
        iconColor: AppColors.purple,
      ),
      ReportsTopCustomersCard(customers: report.topCustomers),
      const SizedBox(height: 12),
      const AppSectionHeader(
        icon: Icon(Icons.receipt_long_rounded),
        title: "Recent Orders",
        iconBackgroundColor: AppColors.yellowLight,
        iconColor: AppColors.yellow,
      ),
      ReportsRecentOrdersCard(orders: report.recentOrders),
    ];
  }

  String _bestDaySubtitle(ShopReportSnapshot report) {
    if (report.dailyBreakdown.isEmpty) {
      return "No data";
    }

    final best = report.dailyBreakdown.fold<ReportDailyBreakdownItem?>(null, (
      current,
      item,
    ) {
      if (current == null || item.revenue > current.revenue) {
        return item;
      }

      return current;
    });

    if (best == null) {
      return "No data";
    }

    final shortLabel = best.label.split(",").first.trim();
    return "$shortLabel · ${_formatCompact(best.revenue)} MMK";
  }

  String _dateTitle(ReportsHomeState state) {
    if (state.selectedPeriod == ReportPeriod.daily) {
      return DateFormat("EEEE, MMMM d").format(state.resolvedAnchorDate);
    }

    if (state.selectedPeriod == ReportPeriod.weekly) {
      final start = startOfReportWeek(state.resolvedAnchorDate);
      final end = DateTime(start.year, start.month, start.day + 6);
      return "${DateFormat("MMM d").format(start)} - ${DateFormat("MMM d").format(end)}";
    }

    return DateFormat("MMMM yyyy").format(state.resolvedAnchorDate);
  }

  String _dateSubtitle(ReportsHomeState state) {
    final report = state.report;

    if (report == null) {
      switch (state.selectedPeriod) {
        case ReportPeriod.daily:
          return "Daily summary";
        case ReportPeriod.weekly:
          return "Weekly trend";
        case ReportPeriod.monthly:
          return "Monthly trend";
      }
    }

    final isToday = _isSameDay(state.resolvedAnchorDate, DateTime.now());
    if (state.selectedPeriod == ReportPeriod.daily && isToday) {
      return "Today · ${report.totalOrders} orders";
    }

    return "${report.totalOrders} orders · ${_formatCompact(report.totalRevenue)} MMK";
  }

  String _heroLabel(ReportPeriod period) {
    switch (period) {
      case ReportPeriod.daily:
        return "Today's Revenue";
      case ReportPeriod.weekly:
        return "This Week Revenue";
      case ReportPeriod.monthly:
        return "This Month Revenue";
    }
  }

  String _deltaText(ReportPeriod period, int deltaAmount) {
    final prefix = deltaAmount >= 0 ? "↑" : "↓";
    final direction = deltaAmount >= 0 ? "+" : "-";
    final base = _formatCompact(deltaAmount.abs());

    switch (period) {
      case ReportPeriod.daily:
        return "$prefix $direction$base MMK vs yesterday";
      case ReportPeriod.weekly:
        return "$prefix $direction$base MMK vs last week";
      case ReportPeriod.monthly:
        return "$prefix $direction$base MMK vs last month";
    }
  }

  String _formatCompact(int amount) {
    if (amount.abs() >= 1000000) {
      final compact = amount / 1000000;
      final hasFraction = compact.truncateToDouble() != compact;
      return "${compact.toStringAsFixed(hasFraction ? 1 : 0)}M";
    }

    if (amount.abs() >= 1000) {
      final compact = amount / 1000;
      final hasFraction = compact.truncateToDouble() != compact;
      return "${compact.toStringAsFixed(hasFraction ? 1 : 0)}K";
    }

    return "$amount";
  }

  bool _isSameDay(DateTime left, DateTime right) {
    return left.year == right.year &&
        left.month == right.month &&
        left.day == right.day;
  }

  Future<void> _onRefresh(BuildContext context) async {
    context.read<ReportsHomeBloc>().add(const ReportsHomeRefreshRequested());
    await Future<void>.delayed(const Duration(milliseconds: 800));
  }
}
