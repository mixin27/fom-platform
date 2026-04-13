import 'dart:convert';

import 'package:app_database/app_database.dart';

import '../../domain/entities/order_item_brief.dart';
import '../../domain/entities/order_list_item.dart';
import '../../domain/entities/order_status.dart';
import 'order_item_brief_model.dart';

class OrderListItemModel extends OrderListItem {
  const OrderListItemModel({
    required super.id,
    required super.shopId,
    required super.orderNo,
    required super.status,
    required super.totalPrice,
    required super.currency,
    required super.customerName,
    required super.customerPhone,
    required super.customerTownship,
    required super.customerAddress,
    required super.items,
    required super.createdAt,
    required super.updatedAt,
    super.customerId,
  });

  factory OrderListItemModel.fromJson(Map<String, dynamic> json) {
    final customer = _asMap(json['customer']);
    final items = _asMapList(
      json['items'],
    ).map(OrderItemBriefModel.fromJson).toList(growable: false);

    return OrderListItemModel(
      id: _asString(json['id']),
      shopId: _asString(json['shop_id']),
      orderNo: _asNullableString(json['order_no']) ?? _asString(json['id']),
      status: OrderStatus.fromApiValue(_asString(json['status'])),
      totalPrice: _asInt(json['total_price']),
      currency: _asNullableString(json['currency']) ?? 'MMK',
      customerName:
          _asNullableString(customer['name']) ??
          _asNullableString(json['customer_name']) ??
          'Customer',
      customerPhone: _asNullableString(customer['phone']) ?? '',
      customerTownship: _asNullableString(customer['township']),
      customerAddress: _asNullableString(customer['address']),
      items: items,
      createdAt: _asDateTime(json['created_at']) ?? DateTime.now(),
      updatedAt:
          _asDateTime(json['updated_at']) ??
          _asDateTime(json['created_at']) ??
          DateTime.now(),
      customerId: _asNullableString(json['customer_id']),
    );
  }

  factory OrderListItemModel.fromCacheRecord(OrderCacheRecord row) {
    return OrderListItemModel(
      id: row.id,
      shopId: row.shopId,
      orderNo: row.orderNo,
      status: OrderStatus.fromApiValue(row.status),
      totalPrice: row.totalPrice,
      currency: row.currency,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerTownship: row.customerTownship,
      customerAddress: row.customerAddress,
      items: _decodeItems(row.itemsJson),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      customerId: null,
    );
  }

  OrderCacheRecordsCompanion toCompanion({required DateTime syncedAt}) {
    return OrderCacheRecordsCompanion(
      id: Value(id),
      shopId: Value(shopId),
      orderNo: Value(orderNo),
      status: Value(status.apiValue),
      totalPrice: Value(totalPrice),
      currency: Value(currency),
      customerName: Value(customerName),
      customerPhone: Value(customerPhone),
      customerTownship: Value(customerTownship),
      customerAddress: Value(customerAddress),
      productSummary: Value(primaryProductSummary),
      itemCount: Value(items.length),
      itemsJson: Value(_encodeItems(items)),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
      syncedAt: Value(syncedAt),
    );
  }

  static List<OrderItemBriefModel> _decodeItems(String encoded) {
    if (encoded.trim().isEmpty) {
      return const <OrderItemBriefModel>[];
    }

    try {
      final decoded = jsonDecode(encoded);
      if (decoded is List) {
        return decoded
            .whereType<Map>()
            .map(
              (item) =>
                  OrderItemBriefModel.fromJson(Map<String, dynamic>.from(item)),
            )
            .toList(growable: false);
      }
    } catch (_) {
      return const <OrderItemBriefModel>[];
    }

    return const <OrderItemBriefModel>[];
  }

  static String _encodeItems(List<OrderItemBrief> items) {
    final payload = items
        .map((item) {
          if (item is OrderItemBriefModel) {
            return item.toJson();
          }

          return <String, dynamic>{
            'id': item.id,
            'product_name': item.productName,
            'qty': item.quantity,
            'unit_price': item.unitPrice,
            'line_total': item.lineTotal,
          };
        })
        .toList(growable: false);

    return jsonEncode(payload);
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

int _asInt(dynamic value) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(_asString(value)) ?? 0;
}

DateTime? _asDateTime(dynamic value) {
  final raw = _asNullableString(value);
  if (raw == null) {
    return null;
  }

  return DateTime.tryParse(raw)?.toLocal();
}
