import "package:equatable/equatable.dart";

import "order_item_brief.dart";
import "order_list_item.dart";
import "order_source.dart";
import "order_status.dart";
import "order_status_history_event.dart";

class OrderDetails extends Equatable {
  const OrderDetails({
    required this.id,
    required this.shopId,
    required this.customerId,
    required this.orderNo,
    required this.status,
    required this.totalPrice,
    required this.currency,
    required this.deliveryFee,
    required this.source,
    required this.customerName,
    required this.customerPhone,
    required this.items,
    required this.createdAt,
    required this.updatedAt,
    required this.statusHistory,
    this.customerTownship,
    this.customerAddress,
    this.note,
  });

  final String id;
  final String shopId;
  final String customerId;
  final String orderNo;
  final OrderStatus status;
  final int totalPrice;
  final String currency;
  final int deliveryFee;
  final OrderSource source;
  final String customerName;
  final String customerPhone;
  final String? customerTownship;
  final String? customerAddress;
  final String? note;
  final List<OrderItemBrief> items;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<OrderStatusHistoryEvent> statusHistory;

  int get subtotal => items.fold<int>(0, (sum, item) => sum + item.lineTotal);

  String get primaryProductSummary {
    if (items.isEmpty) {
      return "Order item";
    }

    final first = items.first;
    if (items.length == 1) {
      return "${first.productName} × ${first.quantity}";
    }

    final remaining = items.length - 1;
    return "${first.productName} × ${first.quantity} +$remaining more";
  }

  OrderListItem toOrderListItem() {
    return OrderListItem(
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

  @override
  List<Object?> get props => [
    id,
    shopId,
    customerId,
    orderNo,
    status,
    totalPrice,
    currency,
    deliveryFee,
    source,
    customerName,
    customerPhone,
    customerTownship,
    customerAddress,
    note,
    items,
    createdAt,
    updatedAt,
    statusHistory,
  ];
}
