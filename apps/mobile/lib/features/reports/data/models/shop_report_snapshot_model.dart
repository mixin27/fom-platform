import "dart:convert";

import "package:app_database/app_database.dart";

import "../../domain/entities/report_period.dart";
import "../../domain/entities/shop_report_snapshot.dart";

class ShopReportSnapshotModel extends ShopReportSnapshot {
  const ShopReportSnapshotModel({
    required super.id,
    required super.shopId,
    required super.period,
    required super.periodKey,
    required super.periodLabel,
    required super.periodStartDate,
    required super.periodEndDate,
    required super.summaryDate,
    required super.totalOrders,
    required super.totalRevenue,
    required super.deliveredCount,
    required super.pendingCount,
    required super.customerCount,
    required super.averageOrderValue,
    required super.revenueDelta,
    required super.deliveredRate,
    required super.statusBreakdown,
    required super.hourlyBreakdown,
    required super.dailyBreakdown,
    required super.topProducts,
    required super.topCustomers,
    required super.recentOrders,
  });

  factory ShopReportSnapshotModel.fromJson(Map<String, dynamic> json) {
    final summaryDate =
        _asDateTime(json["summary_date"]) ??
        _asDateTime(json["period_start_date"]) ??
        DateTime.now();

    final detectedPeriod = _parseReportPeriod(
      json["report_type"],
      fallback: json.containsKey("summary_date")
          ? ReportPeriod.daily
          : ReportPeriod.weekly,
    );

    final periodStartDate =
        _asDateTime(json["period_start_date"]) ?? summaryDate;
    final periodEndDate = _asDateTime(json["period_end_date"]) ?? summaryDate;

    final periodKey =
        _asNullableString(json["period_key"]) ??
        _asNullableString(json["summary_date"]) ??
        buildReportPeriodKey(period: detectedPeriod, anchorDate: summaryDate);

    final periodLabel =
        _asNullableString(json["period_label"]) ??
        _fallbackPeriodLabel(period: detectedPeriod, anchorDate: summaryDate);

    final statusBreakdown = ReportStatusBreakdownModel.fromJson(
      _asMap(json["status_breakdown"]),
    );

    final deliveredCount = _asInt(
      json["delivered_count"],
      fallback: statusBreakdown.delivered,
    );

    final pendingCount = _asInt(
      json["pending_count"],
      fallback: statusBreakdown.pendingTotal,
    );

    final hourlyBreakdown = _asMapList(json["hourly_breakdown"])
        .map<ReportHourlyBreakdownItem>(ReportHourlyBreakdownItemModel.fromJson)
        .toList(growable: false);

    final dailyBreakdown = _asMapList(json["daily_breakdown"])
        .map<ReportDailyBreakdownItem>(ReportDailyBreakdownItemModel.fromJson)
        .toList(growable: false);

    final topProducts = _asMapList(json["top_products"])
        .map<ReportTopProduct>(ReportTopProductModel.fromJson)
        .toList(growable: false);

    final topCustomers = _asMapList(json["top_customers"])
        .map<ReportTopCustomer>(ReportTopCustomerModel.fromJson)
        .toList(growable: false);

    final recentOrders = _asMapList(json["recent_orders"])
        .map<ReportRecentOrder>(ReportRecentOrderModel.fromJson)
        .toList(growable: false);

    final id =
        _asNullableString(json["id"]) ??
        _buildCacheId(
          shopId: _asString(json["shop_id"]),
          period: detectedPeriod,
          periodKey: periodKey,
        );

    return ShopReportSnapshotModel(
      id: id,
      shopId: _asString(json["shop_id"]),
      period: detectedPeriod,
      periodKey: periodKey,
      periodLabel: periodLabel,
      periodStartDate: periodStartDate,
      periodEndDate: periodEndDate,
      summaryDate: summaryDate,
      totalOrders: _asInt(json["total_orders"]),
      totalRevenue: _asInt(json["total_revenue"]),
      deliveredCount: deliveredCount,
      pendingCount: pendingCount,
      customerCount: _asInt(json["customer_count"]),
      averageOrderValue: _asInt(json["average_order_value"]),
      revenueDelta: _asInt(
        json["revenue_delta_vs_previous_period"] ??
            json["revenue_delta_vs_previous_day"],
      ),
      deliveredRate: _asInt(json["delivered_rate"]),
      statusBreakdown: statusBreakdown,
      hourlyBreakdown: hourlyBreakdown,
      dailyBreakdown: dailyBreakdown,
      topProducts: topProducts,
      topCustomers: topCustomers,
      recentOrders: recentOrders,
    );
  }

  factory ShopReportSnapshotModel.fromCacheRecord(ReportCacheRecord row) {
    final payload = _decodePayload(row.payloadJson);
    if (payload == null) {
      final period = _parseReportPeriod(
        row.periodType,
        fallback: ReportPeriod.daily,
      );
      final summaryDate = _safeParsePeriodKeyToDate(period, row.periodKey);

      return ShopReportSnapshotModel(
        id: row.id,
        shopId: row.shopId,
        period: period,
        periodKey: row.periodKey,
        periodLabel: _fallbackPeriodLabel(
          period: period,
          anchorDate: summaryDate,
        ),
        periodStartDate: summaryDate,
        periodEndDate: summaryDate,
        summaryDate: summaryDate,
        totalOrders: 0,
        totalRevenue: 0,
        deliveredCount: 0,
        pendingCount: 0,
        customerCount: 0,
        averageOrderValue: 0,
        revenueDelta: 0,
        deliveredRate: 0,
        statusBreakdown: const ReportStatusBreakdownModel(
          newOrders: 0,
          confirmed: 0,
          outForDelivery: 0,
          delivered: 0,
        ),
        hourlyBreakdown: const <ReportHourlyBreakdownItem>[],
        dailyBreakdown: const <ReportDailyBreakdownItem>[],
        topProducts: const <ReportTopProduct>[],
        topCustomers: const <ReportTopCustomer>[],
        recentOrders: const <ReportRecentOrder>[],
      );
    }

    final parsed = ShopReportSnapshotModel.fromJson(payload);

    return parsed.copyWith(
      id: row.id,
      shopId: row.shopId,
      period: _parseReportPeriod(row.periodType, fallback: parsed.period),
      periodKey: row.periodKey,
    );
  }

  ShopReportSnapshotModel copyWith({
    String? id,
    String? shopId,
    ReportPeriod? period,
    String? periodKey,
    String? periodLabel,
    DateTime? periodStartDate,
    DateTime? periodEndDate,
    DateTime? summaryDate,
    int? totalOrders,
    int? totalRevenue,
    int? deliveredCount,
    int? pendingCount,
    int? customerCount,
    int? averageOrderValue,
    int? revenueDelta,
    int? deliveredRate,
    ReportStatusBreakdown? statusBreakdown,
    List<ReportHourlyBreakdownItem>? hourlyBreakdown,
    List<ReportDailyBreakdownItem>? dailyBreakdown,
    List<ReportTopProduct>? topProducts,
    List<ReportTopCustomer>? topCustomers,
    List<ReportRecentOrder>? recentOrders,
  }) {
    return ShopReportSnapshotModel(
      id: id ?? this.id,
      shopId: shopId ?? this.shopId,
      period: period ?? this.period,
      periodKey: periodKey ?? this.periodKey,
      periodLabel: periodLabel ?? this.periodLabel,
      periodStartDate: periodStartDate ?? this.periodStartDate,
      periodEndDate: periodEndDate ?? this.periodEndDate,
      summaryDate: summaryDate ?? this.summaryDate,
      totalOrders: totalOrders ?? this.totalOrders,
      totalRevenue: totalRevenue ?? this.totalRevenue,
      deliveredCount: deliveredCount ?? this.deliveredCount,
      pendingCount: pendingCount ?? this.pendingCount,
      customerCount: customerCount ?? this.customerCount,
      averageOrderValue: averageOrderValue ?? this.averageOrderValue,
      revenueDelta: revenueDelta ?? this.revenueDelta,
      deliveredRate: deliveredRate ?? this.deliveredRate,
      statusBreakdown: statusBreakdown ?? this.statusBreakdown,
      hourlyBreakdown: hourlyBreakdown ?? this.hourlyBreakdown,
      dailyBreakdown: dailyBreakdown ?? this.dailyBreakdown,
      topProducts: topProducts ?? this.topProducts,
      topCustomers: topCustomers ?? this.topCustomers,
      recentOrders: recentOrders ?? this.recentOrders,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      "id": id,
      "shop_id": shopId,
      "report_type": period.apiValue,
      "period_key": periodKey,
      "period_label": periodLabel,
      "period_start_date": formatDateKey(periodStartDate),
      "period_end_date": formatDateKey(periodEndDate),
      "summary_date": formatDateKey(summaryDate),
      "total_orders": totalOrders,
      "total_revenue": totalRevenue,
      "delivered_count": deliveredCount,
      "pending_count": pendingCount,
      "customer_count": customerCount,
      "average_order_value": averageOrderValue,
      "revenue_delta_vs_previous_period": revenueDelta,
      "delivered_rate": deliveredRate,
      "status_breakdown": _statusBreakdownToJson(statusBreakdown),
      "hourly_breakdown": hourlyBreakdown
          .map(_hourlyBreakdownItemToJson)
          .toList(growable: false),
      "daily_breakdown": dailyBreakdown
          .map(_dailyBreakdownItemToJson)
          .toList(growable: false),
      "top_products": topProducts
          .map(_topProductToJson)
          .toList(growable: false),
      "top_customers": topCustomers
          .map(_topCustomerToJson)
          .toList(growable: false),
      "recent_orders": recentOrders
          .map(_recentOrderToJson)
          .toList(growable: false),
    };
  }

  ReportCacheRecordsCompanion toCompanion({required DateTime syncedAt}) {
    return ReportCacheRecordsCompanion(
      id: Value(id),
      shopId: Value(shopId),
      periodType: Value(period.apiValue),
      periodKey: Value(periodKey),
      payloadJson: Value(jsonEncode(toJson())),
      syncedAt: Value(syncedAt),
    );
  }
}

class ReportStatusBreakdownModel extends ReportStatusBreakdown {
  const ReportStatusBreakdownModel({
    required super.newOrders,
    required super.confirmed,
    required super.outForDelivery,
    required super.delivered,
  });

  factory ReportStatusBreakdownModel.fromJson(Map<String, dynamic> json) {
    return ReportStatusBreakdownModel(
      newOrders: _asInt(json["new"]),
      confirmed: _asInt(json["confirmed"]),
      outForDelivery: _asInt(json["out_for_delivery"]),
      delivered: _asInt(json["delivered"]),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      "new": newOrders,
      "confirmed": confirmed,
      "out_for_delivery": outForDelivery,
      "delivered": delivered,
    };
  }
}

class ReportHourlyBreakdownItemModel extends ReportHourlyBreakdownItem {
  const ReportHourlyBreakdownItemModel({
    required super.hour,
    required super.label,
    required super.orderCount,
    required super.revenue,
  });

  factory ReportHourlyBreakdownItemModel.fromJson(Map<String, dynamic> json) {
    return ReportHourlyBreakdownItemModel(
      hour: _asInt(json["hour"]),
      label: _asNullableString(json["label"]) ?? "",
      orderCount: _asInt(json["order_count"]),
      revenue: _asInt(json["revenue"]),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      "hour": hour,
      "label": label,
      "order_count": orderCount,
      "revenue": revenue,
    };
  }
}

class ReportDailyBreakdownItemModel extends ReportDailyBreakdownItem {
  const ReportDailyBreakdownItemModel({
    required super.date,
    required super.label,
    required super.orderCount,
    required super.revenue,
    required super.deliveredCount,
    required super.pendingCount,
  });

  factory ReportDailyBreakdownItemModel.fromJson(Map<String, dynamic> json) {
    return ReportDailyBreakdownItemModel(
      date: _asDateTime(json["date"]) ?? DateTime.now(),
      label: _asNullableString(json["label"]) ?? "",
      orderCount: _asInt(json["order_count"]),
      revenue: _asInt(json["revenue"]),
      deliveredCount: _asInt(json["delivered_count"]),
      pendingCount: _asInt(json["pending_count"]),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      "date": formatDateKey(date),
      "label": label,
      "order_count": orderCount,
      "revenue": revenue,
      "delivered_count": deliveredCount,
      "pending_count": pendingCount,
    };
  }
}

class ReportTopProductModel extends ReportTopProduct {
  const ReportTopProductModel({
    required super.productName,
    required super.quantitySold,
    required super.revenue,
  });

  factory ReportTopProductModel.fromJson(Map<String, dynamic> json) {
    return ReportTopProductModel(
      productName: _asNullableString(json["product_name"]) ?? "Product",
      quantitySold: _asInt(json["qty_sold"]),
      revenue: _asInt(json["revenue"]),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      "product_name": productName,
      "qty_sold": quantitySold,
      "revenue": revenue,
    };
  }
}

class ReportTopCustomerModel extends ReportTopCustomer {
  const ReportTopCustomerModel({
    required super.customerId,
    required super.customerName,
    required super.orderCount,
    required super.totalSpent,
  });

  factory ReportTopCustomerModel.fromJson(Map<String, dynamic> json) {
    return ReportTopCustomerModel(
      customerId: _asString(json["customer_id"]),
      customerName: _asNullableString(json["customer_name"]) ?? "Customer",
      orderCount: _asInt(json["order_count"]),
      totalSpent: _asInt(json["total_spent"]),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      "customer_id": customerId,
      "customer_name": customerName,
      "order_count": orderCount,
      "total_spent": totalSpent,
    };
  }
}

class ReportRecentOrderModel extends ReportRecentOrder {
  const ReportRecentOrderModel({
    required super.id,
    required super.orderNo,
    required super.customerName,
    required super.productName,
    required super.status,
    required super.totalPrice,
    required super.createdAt,
  });

  factory ReportRecentOrderModel.fromJson(Map<String, dynamic> json) {
    return ReportRecentOrderModel(
      id: _asString(json["id"]),
      orderNo: _asNullableString(json["order_no"]) ?? _asString(json["id"]),
      customerName: _asNullableString(json["customer_name"]) ?? "Customer",
      productName: _asNullableString(json["product_name"]) ?? "Item",
      status: _asNullableString(json["status"]) ?? "new",
      totalPrice: _asInt(json["total_price"]),
      createdAt: _asDateTime(json["created_at"]) ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      "id": id,
      "order_no": orderNo,
      "customer_name": customerName,
      "product_name": productName,
      "status": status,
      "total_price": totalPrice,
      "created_at": createdAt.toIso8601String(),
    };
  }
}

Map<String, dynamic> _statusBreakdownToJson(ReportStatusBreakdown value) {
  if (value is ReportStatusBreakdownModel) {
    return value.toJson();
  }

  return <String, dynamic>{
    "new": value.newOrders,
    "confirmed": value.confirmed,
    "out_for_delivery": value.outForDelivery,
    "delivered": value.delivered,
  };
}

Map<String, dynamic> _hourlyBreakdownItemToJson(
  ReportHourlyBreakdownItem value,
) {
  if (value is ReportHourlyBreakdownItemModel) {
    return value.toJson();
  }

  return <String, dynamic>{
    "hour": value.hour,
    "label": value.label,
    "order_count": value.orderCount,
    "revenue": value.revenue,
  };
}

Map<String, dynamic> _dailyBreakdownItemToJson(ReportDailyBreakdownItem value) {
  if (value is ReportDailyBreakdownItemModel) {
    return value.toJson();
  }

  return <String, dynamic>{
    "date": formatDateKey(value.date),
    "label": value.label,
    "order_count": value.orderCount,
    "revenue": value.revenue,
    "delivered_count": value.deliveredCount,
    "pending_count": value.pendingCount,
  };
}

Map<String, dynamic> _topProductToJson(ReportTopProduct value) {
  if (value is ReportTopProductModel) {
    return value.toJson();
  }

  return <String, dynamic>{
    "product_name": value.productName,
    "qty_sold": value.quantitySold,
    "revenue": value.revenue,
  };
}

Map<String, dynamic> _topCustomerToJson(ReportTopCustomer value) {
  if (value is ReportTopCustomerModel) {
    return value.toJson();
  }

  return <String, dynamic>{
    "customer_id": value.customerId,
    "customer_name": value.customerName,
    "order_count": value.orderCount,
    "total_spent": value.totalSpent,
  };
}

Map<String, dynamic> _recentOrderToJson(ReportRecentOrder value) {
  if (value is ReportRecentOrderModel) {
    return value.toJson();
  }

  return <String, dynamic>{
    "id": value.id,
    "order_no": value.orderNo,
    "customer_name": value.customerName,
    "product_name": value.productName,
    "status": value.status,
    "total_price": value.totalPrice,
    "created_at": value.createdAt.toIso8601String(),
  };
}

Map<String, dynamic>? _decodePayload(String encoded) {
  if (encoded.trim().isEmpty) {
    return null;
  }

  try {
    final decoded = jsonDecode(encoded);
    if (decoded is Map) {
      return Map<String, dynamic>.from(decoded);
    }
  } catch (_) {
    return null;
  }

  return null;
}

String _fallbackPeriodLabel({
  required ReportPeriod period,
  required DateTime anchorDate,
}) {
  switch (period) {
    case ReportPeriod.daily:
      return formatDateKey(anchorDate);
    case ReportPeriod.weekly:
      final start = startOfReportWeek(anchorDate);
      final end = DateTime(start.year, start.month, start.day + 6);
      return "${formatDateKey(start)} - ${formatDateKey(end)}";
    case ReportPeriod.monthly:
      return formatMonthKey(anchorDate);
  }
}

ReportPeriod _parseReportPeriod(
  dynamic value, {
  required ReportPeriod fallback,
}) {
  final normalized = _asString(value).trim().toLowerCase();
  switch (normalized) {
    case "daily":
      return ReportPeriod.daily;
    case "weekly":
      return ReportPeriod.weekly;
    case "monthly":
      return ReportPeriod.monthly;
    default:
      return fallback;
  }
}

DateTime _safeParsePeriodKeyToDate(ReportPeriod period, String periodKey) {
  switch (period) {
    case ReportPeriod.daily:
    case ReportPeriod.weekly:
      return _asDateTime(periodKey) ?? DateTime.now();
    case ReportPeriod.monthly:
      return _asDateTime("$periodKey-01") ?? DateTime.now();
  }
}

String _buildCacheId({
  required String shopId,
  required ReportPeriod period,
  required String periodKey,
}) {
  return "${shopId}_${period.apiValue}_$periodKey";
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }

  return const <String, dynamic>{};
}

List<Map<String, dynamic>> _asMapList(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false);
  }

  return const <Map<String, dynamic>>[];
}

String _asString(dynamic value) {
  if (value == null) {
    return "";
  }

  return value.toString();
}

String? _asNullableString(dynamic value) {
  final raw = _asString(value).trim();
  if (raw.isEmpty) {
    return null;
  }

  return raw;
}

int _asInt(dynamic value, {int fallback = 0}) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(_asString(value)) ?? fallback;
}

DateTime? _asDateTime(dynamic value) {
  final raw = _asNullableString(value);
  if (raw == null) {
    return null;
  }

  return DateTime.tryParse(raw)?.toLocal();
}
