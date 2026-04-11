import 'dart:convert';

import 'package:app_database/app_database.dart';

import '../../domain/entities/customer_list_item.dart';
import '../../domain/entities/customer_recent_order.dart';
import 'customer_recent_order_model.dart';

class CustomerListItemModel extends CustomerListItem {
  const CustomerListItemModel({
    required super.id,
    required super.shopId,
    required super.name,
    required super.phone,
    required super.township,
    required super.address,
    required super.notes,
    required super.avatarUrl,
    required super.createdAt,
    required super.totalOrders,
    required super.totalSpent,
    required super.lastOrderAt,
    required super.deliveredRate,
    required super.isVip,
    required super.isNewThisWeek,
    required super.largestOrderTotal,
    required super.favouriteItem,
    required super.recentOrders,
    required super.hasRecentOrders,
  });

  factory CustomerListItemModel.fromJson(Map<String, dynamic> json) {
    final hasRecentOrders = json.containsKey('recent_orders');
    final recentOrders = hasRecentOrders
        ? _asMapList(
            json['recent_orders'],
          ).map(CustomerRecentOrderModel.fromJson).toList(growable: false)
        : const <CustomerRecentOrderModel>[];

    return CustomerListItemModel(
      id: _asString(json['id']),
      shopId: _asString(json['shop_id']),
      name: _asNullableString(json['name']) ?? 'Customer',
      phone: _asNullableString(json['phone']) ?? '',
      township: _asNullableString(json['township']),
      address: _asNullableString(json['address']),
      notes: _asNullableString(json['notes']),
      avatarUrl: _asNullableString(json['avatar_url']),
      createdAt: _asDateTime(json['created_at']) ?? DateTime.now(),
      totalOrders: _asInt(json['total_orders']),
      totalSpent: _asInt(json['total_spent']),
      lastOrderAt: _asDateTime(json['last_order_at']),
      deliveredRate: _asInt(json['delivered_rate']),
      isVip: _asBool(json['is_vip']),
      isNewThisWeek: _asBool(json['is_new_this_week']),
      largestOrderTotal: _asInt(json['largest_order_total']),
      favouriteItem: _asNullableString(json['favourite_item']),
      recentOrders: recentOrders,
      hasRecentOrders: hasRecentOrders,
    );
  }

  factory CustomerListItemModel.fromCacheRecord(CustomerCacheRecord row) {
    return CustomerListItemModel(
      id: row.id,
      shopId: row.shopId,
      name: row.name,
      phone: row.phone,
      township: row.township,
      address: row.address,
      notes: row.notes,
      avatarUrl: row.avatarUrl,
      createdAt: row.createdAt,
      totalOrders: row.totalOrders,
      totalSpent: row.totalSpent,
      lastOrderAt: row.lastOrderAt,
      deliveredRate: row.deliveredRate,
      isVip: row.isVip,
      isNewThisWeek: row.isNewThisWeek,
      largestOrderTotal: row.largestOrderTotal,
      favouriteItem: row.favouriteItem,
      recentOrders: _decodeRecentOrders(row.recentOrdersJson),
      hasRecentOrders: row.hasRecentOrders,
    );
  }

  CustomerListItemModel withFallbackRecentOrders(
    CustomerListItemModel fallback,
  ) {
    if (hasRecentOrders || !fallback.hasRecentOrders) {
      return this;
    }

    return copyWith(recentOrders: fallback.recentOrders, hasRecentOrders: true);
  }

  CustomerListItemModel copyWith({
    String? id,
    String? shopId,
    String? name,
    String? phone,
    String? township,
    String? address,
    String? notes,
    String? avatarUrl,
    DateTime? createdAt,
    int? totalOrders,
    int? totalSpent,
    DateTime? lastOrderAt,
    bool clearLastOrderAt = false,
    int? deliveredRate,
    bool? isVip,
    bool? isNewThisWeek,
    int? largestOrderTotal,
    String? favouriteItem,
    bool clearFavouriteItem = false,
    List<CustomerRecentOrder>? recentOrders,
    bool? hasRecentOrders,
  }) {
    return CustomerListItemModel(
      id: id ?? this.id,
      shopId: shopId ?? this.shopId,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      township: township ?? this.township,
      address: address ?? this.address,
      notes: notes ?? this.notes,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      createdAt: createdAt ?? this.createdAt,
      totalOrders: totalOrders ?? this.totalOrders,
      totalSpent: totalSpent ?? this.totalSpent,
      lastOrderAt: clearLastOrderAt ? null : (lastOrderAt ?? this.lastOrderAt),
      deliveredRate: deliveredRate ?? this.deliveredRate,
      isVip: isVip ?? this.isVip,
      isNewThisWeek: isNewThisWeek ?? this.isNewThisWeek,
      largestOrderTotal: largestOrderTotal ?? this.largestOrderTotal,
      favouriteItem: clearFavouriteItem
          ? null
          : (favouriteItem ?? this.favouriteItem),
      recentOrders: recentOrders ?? this.recentOrders,
      hasRecentOrders: hasRecentOrders ?? this.hasRecentOrders,
    );
  }

  CustomerCacheRecordsCompanion toCompanion({required DateTime syncedAt}) {
    return CustomerCacheRecordsCompanion(
      id: Value(id),
      shopId: Value(shopId),
      name: Value(name),
      phone: Value(phone),
      township: Value(township),
      address: Value(address),
      notes: Value(notes),
      avatarUrl: Value(avatarUrl),
      createdAt: Value(createdAt),
      totalOrders: Value(totalOrders),
      totalSpent: Value(totalSpent),
      lastOrderAt: Value(lastOrderAt),
      deliveredRate: Value(deliveredRate),
      isVip: Value(isVip),
      isNewThisWeek: Value(isNewThisWeek),
      largestOrderTotal: Value(largestOrderTotal),
      favouriteItem: Value(favouriteItem),
      recentOrdersJson: Value(_encodeRecentOrders(recentOrders)),
      hasRecentOrders: Value(hasRecentOrders),
      syncedAt: Value(syncedAt),
    );
  }

  static List<CustomerRecentOrderModel> _decodeRecentOrders(String encoded) {
    if (encoded.trim().isEmpty) {
      return const <CustomerRecentOrderModel>[];
    }

    try {
      final decoded = jsonDecode(encoded);
      if (decoded is List) {
        return decoded
            .whereType<Map>()
            .map(
              (item) => CustomerRecentOrderModel.fromJson(
                Map<String, dynamic>.from(item),
              ),
            )
            .toList(growable: false);
      }
    } catch (_) {
      return const <CustomerRecentOrderModel>[];
    }

    return const <CustomerRecentOrderModel>[];
  }

  static String _encodeRecentOrders(List<CustomerRecentOrder> orders) {
    final payload = orders
        .map((order) {
          if (order is CustomerRecentOrderModel) {
            return order.toJson();
          }

          return <String, dynamic>{
            'id': order.id,
            'order_no': order.orderNo,
            'status': order.status,
            'total_price': order.totalPrice,
            'created_at': order.createdAt.toIso8601String(),
            'product_name': order.productName,
          };
        })
        .toList(growable: false);

    return jsonEncode(payload);
  }
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

bool _asBool(dynamic value) {
  if (value is bool) {
    return value;
  }

  if (value is num) {
    return value != 0;
  }

  final normalized = _asString(value).trim().toLowerCase();
  return normalized == 'true' || normalized == '1' || normalized == 'yes';
}

DateTime? _asDateTime(dynamic value) {
  final raw = _asNullableString(value);
  if (raw == null) {
    return null;
  }

  return DateTime.tryParse(raw)?.toLocal();
}
