import "../../domain/entities/order_details.dart";
import "../../domain/entities/order_source.dart";
import "../../domain/entities/order_status.dart";
import "../../domain/entities/order_status_history_event.dart";
import "order_item_brief_model.dart";
import "order_list_item_model.dart";
import "order_status_history_event_model.dart";

class OrderDetailsModel extends OrderDetails {
  const OrderDetailsModel({
    required super.id,
    required super.shopId,
    required super.customerId,
    required super.orderNo,
    required super.status,
    required super.totalPrice,
    required super.currency,
    required super.deliveryFee,
    required super.source,
    required super.customerName,
    required super.customerPhone,
    required super.items,
    required super.createdAt,
    required super.updatedAt,
    required super.statusHistory,
    super.customerTownship,
    super.customerAddress,
    super.note,
  });

  factory OrderDetailsModel.fromJson(Map<String, dynamic> json) {
    final customer = _asMap(json["customer"]);
    final items = _asMapList(
      json["items"],
    ).map(OrderItemBriefModel.fromJson).toList(growable: false);
    final statusHistory = _asMapList(
      json["status_history"],
    ).map(OrderStatusHistoryEventModel.fromJson).toList(growable: false);

    return OrderDetailsModel(
      id: _asString(json["id"]),
      shopId: _asString(json["shop_id"]),
      customerId: _asString(json["customer_id"]),
      orderNo: _asNullableString(json["order_no"]) ?? _asString(json["id"]),
      status: OrderStatus.fromApiValue(_asString(json["status"])),
      totalPrice: _asInt(json["total_price"]),
      currency: _asNullableString(json["currency"]) ?? "MMK",
      deliveryFee: _asInt(json["delivery_fee"]),
      source: OrderSource.fromApiValue(_asString(json["source"])),
      customerName: _asNullableString(customer["name"]) ?? "Customer",
      customerPhone: _asNullableString(customer["phone"]) ?? "",
      customerTownship: _asNullableString(customer["township"]),
      customerAddress: _asNullableString(customer["address"]),
      note: _asNullableString(json["note"]),
      items: items,
      createdAt: _asDateTime(json["created_at"]) ?? DateTime.now(),
      updatedAt:
          _asDateTime(json["updated_at"]) ??
          _asDateTime(json["created_at"]) ??
          DateTime.now(),
      statusHistory: statusHistory,
    );
  }

  OrderListItemModel toListItemModel() {
    return OrderListItemModel(
      id: id,
      shopId: shopId,
      orderNo: orderNo,
      status: status,
      totalPrice: totalPrice,
      currency: currency,
      customerName: customerName,
      customerPhone: customerPhone,
      customerTownship: customerTownship,
      customerAddress: customerAddress,
      items: items,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  List<OrderStatusHistoryEvent> get normalizedStatusHistory {
    if (statusHistory.isNotEmpty) {
      return statusHistory;
    }

    return <OrderStatusHistoryEvent>[
      OrderStatusHistoryEventModel(
        id: "created:$id",
        fromStatus: null,
        toStatus: status,
        changedAt: createdAt,
      ),
    ];
  }
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
