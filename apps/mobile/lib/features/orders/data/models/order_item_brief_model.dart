import '../../domain/entities/order_item_brief.dart';

class OrderItemBriefModel extends OrderItemBrief {
  const OrderItemBriefModel({
    required super.id,
    required super.productName,
    required super.quantity,
    required super.unitPrice,
    required super.lineTotal,
  });

  factory OrderItemBriefModel.fromJson(Map<String, dynamic> json) {
    final qty = _asInt(json['qty'], fallback: 1);
    final unitPrice = _asInt(json['unit_price']);

    return OrderItemBriefModel(
      id: _asString(json['id']),
      productName: _asNullableString(json['product_name']) ?? 'Order item',
      quantity: qty,
      unitPrice: unitPrice,
      lineTotal: _asInt(json['line_total'], fallback: qty * unitPrice),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'product_name': productName,
      'qty': quantity,
      'unit_price': unitPrice,
      'line_total': lineTotal,
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
