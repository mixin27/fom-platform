import "package:equatable/equatable.dart";

import "report_period.dart";

class ShopReportSnapshot extends Equatable {
  const ShopReportSnapshot({
    required this.id,
    required this.shopId,
    required this.period,
    required this.periodKey,
    required this.periodLabel,
    required this.periodStartDate,
    required this.periodEndDate,
    required this.summaryDate,
    required this.totalOrders,
    required this.totalRevenue,
    required this.deliveredCount,
    required this.pendingCount,
    required this.customerCount,
    required this.averageOrderValue,
    required this.revenueDelta,
    required this.deliveredRate,
    required this.statusBreakdown,
    required this.hourlyBreakdown,
    required this.dailyBreakdown,
    required this.topProducts,
    required this.topCustomers,
    required this.recentOrders,
  });

  final String id;
  final String shopId;
  final ReportPeriod period;
  final String periodKey;
  final String periodLabel;
  final DateTime periodStartDate;
  final DateTime periodEndDate;
  final DateTime summaryDate;

  final int totalOrders;
  final int totalRevenue;
  final int deliveredCount;
  final int pendingCount;
  final int customerCount;
  final int averageOrderValue;
  final int revenueDelta;
  final int deliveredRate;

  final ReportStatusBreakdown statusBreakdown;
  final List<ReportHourlyBreakdownItem> hourlyBreakdown;
  final List<ReportDailyBreakdownItem> dailyBreakdown;
  final List<ReportTopProduct> topProducts;
  final List<ReportTopCustomer> topCustomers;
  final List<ReportRecentOrder> recentOrders;

  bool get hasHourlyBreakdown => hourlyBreakdown.isNotEmpty;

  bool get hasDailyBreakdown => dailyBreakdown.isNotEmpty;

  @override
  List<Object?> get props => [
    id,
    shopId,
    period,
    periodKey,
    periodLabel,
    periodStartDate,
    periodEndDate,
    summaryDate,
    totalOrders,
    totalRevenue,
    deliveredCount,
    pendingCount,
    customerCount,
    averageOrderValue,
    revenueDelta,
    deliveredRate,
    statusBreakdown,
    hourlyBreakdown,
    dailyBreakdown,
    topProducts,
    topCustomers,
    recentOrders,
  ];
}

class ReportStatusBreakdown extends Equatable {
  const ReportStatusBreakdown({
    required this.newOrders,
    required this.confirmed,
    required this.outForDelivery,
    required this.delivered,
  });

  final int newOrders;
  final int confirmed;
  final int outForDelivery;
  final int delivered;

  int get pendingTotal => newOrders + confirmed + outForDelivery;

  int get total => pendingTotal + delivered;

  @override
  List<Object?> get props => [newOrders, confirmed, outForDelivery, delivered];
}

class ReportHourlyBreakdownItem extends Equatable {
  const ReportHourlyBreakdownItem({
    required this.hour,
    required this.label,
    required this.orderCount,
    required this.revenue,
  });

  final int hour;
  final String label;
  final int orderCount;
  final int revenue;

  @override
  List<Object?> get props => [hour, label, orderCount, revenue];
}

class ReportDailyBreakdownItem extends Equatable {
  const ReportDailyBreakdownItem({
    required this.date,
    required this.label,
    required this.orderCount,
    required this.revenue,
    required this.deliveredCount,
    required this.pendingCount,
  });

  final DateTime date;
  final String label;
  final int orderCount;
  final int revenue;
  final int deliveredCount;
  final int pendingCount;

  @override
  List<Object?> get props => [
    date,
    label,
    orderCount,
    revenue,
    deliveredCount,
    pendingCount,
  ];
}

class ReportTopProduct extends Equatable {
  const ReportTopProduct({
    required this.productName,
    required this.quantitySold,
    required this.revenue,
  });

  final String productName;
  final int quantitySold;
  final int revenue;

  @override
  List<Object?> get props => [productName, quantitySold, revenue];
}

class ReportTopCustomer extends Equatable {
  const ReportTopCustomer({
    required this.customerId,
    required this.customerName,
    required this.orderCount,
    required this.totalSpent,
  });

  final String customerId;
  final String customerName;
  final int orderCount;
  final int totalSpent;

  @override
  List<Object?> get props => [customerId, customerName, orderCount, totalSpent];
}

class ReportRecentOrder extends Equatable {
  const ReportRecentOrder({
    required this.id,
    required this.orderNo,
    required this.customerName,
    required this.productName,
    required this.status,
    required this.totalPrice,
    required this.createdAt,
  });

  final String id;
  final String orderNo;
  final String customerName;
  final String productName;
  final String status;
  final int totalPrice;
  final DateTime createdAt;

  @override
  List<Object?> get props => [
    id,
    orderNo,
    customerName,
    productName,
    status,
    totalPrice,
    createdAt,
  ];
}
