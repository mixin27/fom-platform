import 'package:equatable/equatable.dart';

import 'customer_recent_order.dart';

class CustomerListItem extends Equatable {
  const CustomerListItem({
    required this.id,
    required this.shopId,
    required this.name,
    required this.phone,
    required this.township,
    required this.address,
    required this.notes,
    required this.avatarUrl,
    required this.createdAt,
    required this.totalOrders,
    required this.totalSpent,
    required this.lastOrderAt,
    required this.deliveredRate,
    required this.isVip,
    required this.isNewThisWeek,
    required this.largestOrderTotal,
    required this.favouriteItem,
    required this.recentOrders,
    required this.hasRecentOrders,
  });

  final String id;
  final String shopId;
  final String name;
  final String phone;
  final String? township;
  final String? address;
  final String? notes;
  final String? avatarUrl;
  final DateTime createdAt;
  final int totalOrders;
  final int totalSpent;
  final DateTime? lastOrderAt;
  final int deliveredRate;
  final bool isVip;
  final bool isNewThisWeek;
  final int largestOrderTotal;
  final String? favouriteItem;
  final List<CustomerRecentOrder> recentOrders;
  final bool hasRecentOrders;

  bool get isLoyal => totalOrders >= 6 || totalSpent >= 180000;

  String get firstLetter {
    final normalized = name.trim();
    if (normalized.isEmpty) {
      return '#';
    }

    final first = normalized[0].toUpperCase();
    return RegExp(r'[A-Z]').hasMatch(first) ? first : '#';
  }

  @override
  List<Object?> get props => [
    id,
    shopId,
    name,
    phone,
    township,
    address,
    notes,
    avatarUrl,
    createdAt,
    totalOrders,
    totalSpent,
    lastOrderAt,
    deliveredRate,
    isVip,
    isNewThisWeek,
    largestOrderTotal,
    favouriteItem,
    recentOrders,
    hasRecentOrders,
  ];
}
