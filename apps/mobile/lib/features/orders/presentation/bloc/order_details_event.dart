import "package:equatable/equatable.dart";

import "../../domain/entities/order_list_item.dart";
import "../../domain/entities/order_status.dart";

sealed class OrderDetailsEvent extends Equatable {
  const OrderDetailsEvent();

  @override
  List<Object?> get props => const [];
}

class OrderDetailsStarted extends OrderDetailsEvent {
  const OrderDetailsStarted({required this.shopId, required this.orderId});

  final String shopId;
  final String orderId;

  @override
  List<Object?> get props => [shopId, orderId];
}

class OrderDetailsRefreshRequested extends OrderDetailsEvent {
  const OrderDetailsRefreshRequested({this.silent = false});

  final bool silent;

  @override
  List<Object?> get props => [silent];
}

class OrderDetailsStatusChangeRequested extends OrderDetailsEvent {
  const OrderDetailsStatusChangeRequested({
    required this.nextStatus,
    this.note,
  });

  final OrderStatus nextStatus;
  final String? note;

  @override
  List<Object?> get props => [nextStatus, note];
}

class OrderDetailsCachedOrderUpdated extends OrderDetailsEvent {
  const OrderDetailsCachedOrderUpdated(this.order);

  final OrderListItem? order;

  @override
  List<Object?> get props => [order];
}

class OrderDetailsErrorDismissed extends OrderDetailsEvent {
  const OrderDetailsErrorDismissed();
}
