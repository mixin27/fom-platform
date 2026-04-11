import "../../domain/entities/order_status.dart";
import "../../domain/entities/order_status_history_event.dart";

class OrderStatusHistoryEventModel extends OrderStatusHistoryEvent {
  const OrderStatusHistoryEventModel({
    required super.id,
    required super.toStatus,
    required super.changedAt,
    super.fromStatus,
    super.note,
    super.changedByName,
  });

  factory OrderStatusHistoryEventModel.fromJson(Map<String, dynamic> json) {
    final changedBy = _asMap(json["changed_by"]);

    return OrderStatusHistoryEventModel(
      id: _asString(json["id"]),
      fromStatus: _asNullableStatus(json["from_status"]),
      toStatus: OrderStatus.fromApiValue(_asString(json["to_status"])),
      changedAt: _asDateTime(json["changed_at"]) ?? DateTime.now(),
      note: _asNullableString(json["note"]),
      changedByName: _asNullableString(changedBy["name"]),
    );
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

OrderStatus? _asNullableStatus(dynamic value) {
  final raw = _asNullableString(value);
  if (raw == null) {
    return null;
  }

  return OrderStatus.fromApiValue(raw);
}

DateTime? _asDateTime(dynamic value) {
  final raw = _asNullableString(value);
  if (raw == null) {
    return null;
  }

  return DateTime.tryParse(raw)?.toLocal();
}
