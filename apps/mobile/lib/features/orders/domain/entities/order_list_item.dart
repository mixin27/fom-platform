import 'package:equatable/equatable.dart';

import 'order_item_brief.dart';
import 'order_status.dart';

class OrderListItem extends Equatable {
  const OrderListItem({
    required this.id,
    required this.shopId,
    required this.orderNo,
    required this.status,
    required this.totalPrice,
    required this.currency,
    required this.customerName,
    required this.customerPhone,
    required this.customerTownship,
    required this.customerAddress,
    required this.items,
    required this.createdAt,
    required this.updatedAt,
    this.customerId,
  });

  final String id;
  final String shopId;
  final String orderNo;
  final OrderStatus status;
  final int totalPrice;
  final String currency;
  final String customerName;
  final String customerPhone;
  final String? customerTownship;
  final String? customerAddress;
  final List<OrderItemBrief> items;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? customerId;

  String get primaryProductSummary {
    if (items.isEmpty) {
      return 'Order item';
    }

    final first = items.first;
    if (items.length == 1) {
      return '${first.productName} × ${first.quantity}';
    }

    final remaining = items.length - 1;
    return '${first.productName} × ${first.quantity} +$remaining more';
  }

  @override
  List<Object?> get props => [
    id,
    shopId,
    orderNo,
    status,
    totalPrice,
    currency,
    customerName,
    customerPhone,
    customerTownship,
    customerAddress,
    items,
    createdAt,
    updatedAt,
    customerId,
  ];
}
