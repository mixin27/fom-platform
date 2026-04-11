import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";

import "../../domain/entities/report_period.dart";
import "../../domain/entities/shop_report_snapshot.dart";

class ReportsHeader extends StatelessWidget {
  const ReportsHeader({
    required this.selectedPeriod,
    required this.dateTitle,
    required this.dateSubtitle,
    required this.canNavigateNext,
    required this.onSharePressed,
    required this.onPeriodChanged,
    required this.onPreviousPressed,
    required this.onNextPressed,
    super.key,
  });

  final ReportPeriod selectedPeriod;
  final String dateTitle;
  final String dateSubtitle;
  final bool canNavigateNext;
  final VoidCallback onSharePressed;
  final ValueChanged<ReportPeriod> onPeriodChanged;
  final VoidCallback onPreviousPressed;
  final VoidCallback onNextPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
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
                    selectedPeriod.titleLabel,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    selectedPeriod.titleLabelMyanmar,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textLight,
                      fontFamily: "NotoSansMyanmar",
                    ),
                  ),
                ],
              ),
              TextButton.icon(
                onPressed: onSharePressed,
                style: TextButton.styleFrom(
                  backgroundColor: AppColors.softOrangeLight,
                  foregroundColor: AppColors.softOrange,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(
                      color: AppColors.softOrangeMid,
                      width: 1.5,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  textStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                icon: const Icon(Icons.ios_share_rounded, size: 16),
                label: Text(
                  selectedPeriod == ReportPeriod.daily ? "Share" : "Export",
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _ReportPeriodTabs(
            selectedPeriod: selectedPeriod,
            onPeriodChanged: onPeriodChanged,
          ),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(14),
            ),
            padding: const EdgeInsets.all(4),
            child: Row(
              children: [
                _DateNavButton(
                  icon: Icons.chevron_left_rounded,
                  onTap: onPreviousPressed,
                ),
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        dateTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textDark,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        dateSubtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textLight,
                        ),
                      ),
                    ],
                  ),
                ),
                _DateNavButton(
                  icon: Icons.chevron_right_rounded,
                  onTap: canNavigateNext ? onNextPressed : null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReportPeriodTabs extends StatelessWidget {
  const _ReportPeriodTabs({
    required this.selectedPeriod,
    required this.onPeriodChanged,
  });

  final ReportPeriod selectedPeriod;
  final ValueChanged<ReportPeriod> onPeriodChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          for (final period in ReportPeriod.values)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: _ReportPeriodTabButton(
                  label: period.tabLabel,
                  isSelected: period == selectedPeriod,
                  onTap: () => onPeriodChanged(period),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ReportPeriodTabButton extends StatelessWidget {
  const _ReportPeriodTabButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? AppColors.softOrange : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: isSelected
                ? null
                : Border.all(color: AppColors.border, width: 2),
          ),
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

class _DateNavButton extends StatelessWidget {
  const _DateNavButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: onTap == null ? 0.35 : 1,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border, width: 1.5),
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: 16, color: AppColors.textDark),
          ),
        ),
      ),
    );
  }
}

class ReportsStatusBreakdownGrid extends StatelessWidget {
  const ReportsStatusBreakdownGrid({required this.breakdown, super.key});

  final ReportStatusBreakdown breakdown;

  @override
  Widget build(BuildContext context) {
    final items = <_StatusBreakdownItemData>[
      _StatusBreakdownItemData(
        icon: Icons.fiber_new_rounded,
        iconBackgroundColor: AppColors.softOrangeLight,
        iconColor: AppColors.softOrange,
        value: breakdown.newOrders,
        label: "NEW",
        valueColor: AppColors.softOrange,
      ),
      _StatusBreakdownItemData(
        icon: Icons.check_circle_rounded,
        iconBackgroundColor: AppColors.tealLight,
        iconColor: AppColors.teal,
        value: breakdown.confirmed,
        label: "CONFIRMED",
        valueColor: AppColors.teal,
      ),
      _StatusBreakdownItemData(
        icon: Icons.local_shipping_rounded,
        iconBackgroundColor: AppColors.yellowLight,
        iconColor: AppColors.yellow,
        value: breakdown.outForDelivery,
        label: "SHIPPING",
        valueColor: AppColors.yellow,
      ),
      _StatusBreakdownItemData(
        icon: Icons.done_all_rounded,
        iconBackgroundColor: AppColors.greenLight,
        iconColor: AppColors.green,
        value: breakdown.delivered,
        label: "DELIVERED",
        valueColor: AppColors.green,
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 2.2,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return _StatusBreakdownCard(item: item);
      },
    );
  }
}

class _StatusBreakdownItemData {
  const _StatusBreakdownItemData({
    required this.icon,
    required this.iconBackgroundColor,
    required this.iconColor,
    required this.value,
    required this.label,
    required this.valueColor,
  });

  final IconData icon;
  final Color iconBackgroundColor;
  final Color iconColor;
  final int value;
  final String label;
  final Color valueColor;
}

class _StatusBreakdownCard extends StatelessWidget {
  const _StatusBreakdownCard({required this.item});

  final _StatusBreakdownItemData item;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: item.iconBackgroundColor,
              borderRadius: BorderRadius.circular(14),
            ),
            alignment: Alignment.center,
            child: Icon(item.icon, size: 18, color: item.iconColor),
          ),
          const SizedBox(width: 10),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "${item.value}",
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: item.valueColor,
                ),
              ),
              Text(
                item.label,
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

class ReportsTopProductsCard extends StatelessWidget {
  const ReportsTopProductsCard({required this.products, super.key});

  final List<ReportTopProduct> products;

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) {
      return const AppEmptyState(
        icon: Icon(Icons.inventory_2_outlined),
        title: "No product data",
        message: "Top products will appear after orders are synced.",
      );
    }

    final maxRevenue = products
        .map((item) => item.revenue)
        .fold<int>(0, (max, value) => value > max ? value : max);

    return AppCard(
      showShadow: false,
      borderRadius: 18,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          for (var index = 0; index < products.length; index++)
            _ProductRow(
              rank: index + 1,
              item: products[index],
              maxRevenue: maxRevenue,
              isLast: index == products.length - 1,
            ),
        ],
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  const _ProductRow({
    required this.rank,
    required this.item,
    required this.maxRevenue,
    required this.isLast,
  });

  final int rank;
  final ReportTopProduct item;
  final int maxRevenue;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final progress = maxRevenue == 0 ? 0.0 : item.revenue / maxRevenue;

    return Container(
      padding: EdgeInsets.only(
        top: rank == 1 ? 0 : 10,
        bottom: isLast ? 0 : 10,
      ),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(
                bottom: BorderSide(color: AppColors.border, width: 1),
              ),
      ),
      child: Row(
        children: [
          _RankBadge(rank: rank),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.productName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                  ),
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    minHeight: 4,
                    value: progress.clamp(0, 1).toDouble(),
                    backgroundColor: AppColors.border,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.softOrange,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                "${item.quantitySold} pcs",
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textDark,
                ),
              ),
              Text(
                "${_formatCompact(item.revenue)} MMK",
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
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

class _RankBadge extends StatelessWidget {
  const _RankBadge({required this.rank});

  final int rank;

  @override
  Widget build(BuildContext context) {
    Color background;
    Color foreground;

    switch (rank) {
      case 1:
        background = AppColors.yellowLight;
        foreground = const Color(0xFFD97706);
      case 2:
        background = const Color(0xFFF1F5F9);
        foreground = const Color(0xFF64748B);
      case 3:
        background = const Color(0xFFFEF2E8);
        foreground = const Color(0xFF92400E);
      default:
        background = AppColors.softOrangeLight;
        foreground = AppColors.softOrange;
    }

    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      alignment: Alignment.center,
      child: Text(
        "$rank",
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w900,
          color: foreground,
        ),
      ),
    );
  }
}

class ReportsTopCustomersCard extends StatelessWidget {
  const ReportsTopCustomersCard({required this.customers, super.key});

  final List<ReportTopCustomer> customers;

  @override
  Widget build(BuildContext context) {
    if (customers.isEmpty) {
      return const AppEmptyState(
        icon: Icon(Icons.people_outline),
        title: "No customer highlights",
        message: "Top customers will appear after more orders are completed.",
      );
    }

    return AppCard(
      showShadow: false,
      borderRadius: 18,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          for (var index = 0; index < customers.length; index++)
            _CustomerRow(
              rank: index + 1,
              item: customers[index],
              isLast: index == customers.length - 1,
            ),
        ],
      ),
    );
  }
}

class _CustomerRow extends StatelessWidget {
  const _CustomerRow({
    required this.rank,
    required this.item,
    required this.isLast,
  });

  final int rank;
  final ReportTopCustomer item;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: rank == 1 ? 0 : 10,
        bottom: isLast ? 0 : 10,
      ),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(
                bottom: BorderSide(color: AppColors.border, width: 1),
              ),
      ),
      child: Row(
        children: [
          _RankBadge(rank: rank),
          const SizedBox(width: 10),
          const AppAvatar(size: 32, icon: Icon(Icons.person_outline_rounded)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.customerName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  "${item.orderCount} orders",
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),
          Text(
            "${_formatCompact(item.totalSpent)} MMK",
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: AppColors.softOrange,
            ),
          ),
        ],
      ),
    );
  }
}

class ReportsRecentOrdersCard extends StatelessWidget {
  const ReportsRecentOrdersCard({required this.orders, super.key});

  final List<ReportRecentOrder> orders;

  @override
  Widget build(BuildContext context) {
    if (orders.isEmpty) {
      return const AppEmptyState(
        icon: Icon(Icons.receipt_long_outlined),
        title: "No recent orders",
        message: "Recent orders will appear after a sync.",
      );
    }

    return AppCard(
      showShadow: false,
      borderRadius: 18,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          for (var index = 0; index < orders.length; index++)
            _RecentOrderRow(
              item: orders[index],
              isLast: index == orders.length - 1,
            ),
        ],
      ),
    );
  }
}

class _RecentOrderRow extends StatelessWidget {
  const _RecentOrderRow({required this.item, required this.isLast});

  final ReportRecentOrder item;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final badge = _statusBadge(item.status);

    return Container(
      padding: EdgeInsets.only(top: isLast ? 0 : 2, bottom: isLast ? 0 : 10),
      margin: EdgeInsets.only(bottom: isLast ? 0 : 8),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(
                bottom: BorderSide(color: AppColors.border, width: 1),
              ),
      ),
      child: Row(
        children: [
          const AppAvatar(size: 32, icon: Icon(Icons.shopping_bag_outlined)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.customerName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  item.productName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                "${_formatCompact(item.totalPrice)} MMK",
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: badge.background,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  badge.label,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: badge.foreground,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatusBadgeStyle {
  const _StatusBadgeStyle({
    required this.label,
    required this.background,
    required this.foreground,
  });

  final String label;
  final Color background;
  final Color foreground;
}

_StatusBadgeStyle _statusBadge(String rawStatus) {
  final status = rawStatus.trim().toLowerCase();

  switch (status) {
    case "delivered":
      return const _StatusBadgeStyle(
        label: "Delivered",
        background: AppColors.greenLight,
        foreground: AppColors.green,
      );
    case "out_for_delivery":
      return const _StatusBadgeStyle(
        label: "Shipping",
        background: AppColors.yellowLight,
        foreground: AppColors.yellow,
      );
    case "confirmed":
      return const _StatusBadgeStyle(
        label: "Confirmed",
        background: AppColors.tealLight,
        foreground: AppColors.teal,
      );
    default:
      return const _StatusBadgeStyle(
        label: "New",
        background: AppColors.softOrangeLight,
        foreground: AppColors.softOrange,
      );
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

void showReportsShareSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (context) {
      return Container(
        decoration: const BoxDecoration(
          color: AppColors.warmWhite,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              "Share Report",
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              "အစီရင်ခံစာ မျှဝေမည်",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textLight,
                fontFamily: "NotoSansMyanmar",
              ),
            ),
            const SizedBox(height: 14),
            const _ShareOptionTile(
              icon: Icons.bar_chart_rounded,
              iconBackground: AppColors.greenLight,
              iconColor: AppColors.green,
              title: "View Analytics",
              subtitle: "Open interactive dashboard view",
            ),
            const _ShareOptionTile(
              icon: Icons.picture_as_pdf_rounded,
              iconBackground: Color(0xFFE8F1FF),
              iconColor: Color(0xFF2563EB),
              title: "Export PDF",
              subtitle: "Printable summary report",
            ),
            const _ShareOptionTile(
              icon: Icons.message_rounded,
              iconBackground: AppColors.softOrangeLight,
              iconColor: AppColors.softOrange,
              title: "Share to Message",
              subtitle: "Send summary as a message",
            ),
            const _ShareOptionTile(
              icon: Icons.image_rounded,
              iconBackground: AppColors.purpleLight,
              iconColor: AppColors.purple,
              title: "Save as Image",
              subtitle: "Generate social-ready image",
            ),
          ],
        ),
      );
    },
  );
}

class _ShareOptionTile extends StatelessWidget {
  const _ShareOptionTile({
    required this.icon,
    required this.iconBackground,
    required this.iconColor,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final Color iconBackground;
  final Color iconColor;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => Navigator.of(context).pop(),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: iconBackground,
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMid,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.textLight,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}
