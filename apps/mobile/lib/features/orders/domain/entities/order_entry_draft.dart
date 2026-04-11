import "package:equatable/equatable.dart";

import "order_entry_customer_draft.dart";
import "order_entry_item_draft.dart";
import "order_source.dart";
import "order_status.dart";

class OrderEntryDraft extends Equatable {
  const OrderEntryDraft({
    required this.customer,
    required this.items,
    required this.status,
    required this.source,
    this.deliveryFee = 0,
    this.note,
    this.currency = "MMK",
  });

  final OrderEntryCustomerDraft customer;
  final List<OrderEntryItemDraft> items;
  final OrderStatus status;
  final OrderSource source;
  final int deliveryFee;
  final String? note;
  final String currency;

  int get subtotal {
    return items.fold<int>(0, (sum, item) => sum + item.lineTotal);
  }

  int get totalPrice => subtotal + deliveryFee;

  @override
  List<Object?> get props => [
    customer,
    items,
    status,
    source,
    deliveryFee,
    note,
    currency,
  ];
}
