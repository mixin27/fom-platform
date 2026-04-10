import '../../domain/entities/customer_recent_order.dart';

class CustomerRecentOrderModel extends CustomerRecentOrder {
  const CustomerRecentOrderModel({
    required super.id,
    required super.orderNo,
    required super.status,
    required super.totalPrice,
    required super.createdAt,
    required super.productName,
  });

  factory CustomerRecentOrderModel.fromJson(Map<String, dynamic> json) {
    return CustomerRecentOrderModel(
      id: _asString(json['id']),
      orderNo: _asNullableString(json['order_no']) ?? _asString(json['id']),
      status: _asNullableString(json['status']) ?? 'new_order',
      totalPrice: _asInt(json['total_price']),
      createdAt: _asDateTime(json['created_at']) ?? DateTime.now(),
      productName: _asNullableString(json['product_name']) ?? 'Order item',
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'order_no': orderNo,
      'status': status,
      'total_price': totalPrice,
      'created_at': createdAt.toIso8601String(),
      'product_name': productName,
    };
  }
}

String _asString(dynamic value) {
  if (value == null) {
    return '';
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

  final parsed = int.tryParse(_asString(value));
  return parsed ?? fallback;
}

DateTime? _asDateTime(dynamic value) {
  final raw = _asNullableString(value);
  if (raw == null) {
    return null;
  }

  return DateTime.tryParse(raw)?.toLocal();
}
