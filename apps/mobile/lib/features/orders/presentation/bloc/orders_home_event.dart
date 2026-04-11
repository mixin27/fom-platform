import 'package:equatable/equatable.dart';

import '../../domain/entities/order_list_item.dart';
import '../../domain/entities/order_status.dart';
import '../models/orders_home_tab.dart';

sealed class OrdersHomeEvent extends Equatable {
  const OrdersHomeEvent();

  @override
  List<Object?> get props => const [];
}

class OrdersHomeStarted extends OrdersHomeEvent {
  const OrdersHomeStarted({required this.shopId, required this.shopName});

  final String shopId;
  final String shopName;

  @override
  List<Object?> get props => [shopId, shopName];
}

class OrdersHomeRefreshRequested extends OrdersHomeEvent {
  const OrdersHomeRefreshRequested({this.silent = false});

  final bool silent;

  @override
  List<Object?> get props => [silent];
}

class OrdersHomeTabChanged extends OrdersHomeEvent {
  const OrdersHomeTabChanged(this.tab);

  final OrdersHomeTab tab;

  @override
  List<Object?> get props => [tab];
}

class OrdersHomeSearchChanged extends OrdersHomeEvent {
  const OrdersHomeSearchChanged(this.query);

  final String query;

  @override
  List<Object?> get props => [query];
}

class OrdersHomeOrderStatusChangeRequested extends OrdersHomeEvent {
  const OrdersHomeOrderStatusChangeRequested({
    required this.orderId,
    required this.nextStatus,
    this.note,
  });

  final String orderId;
  final OrderStatus nextStatus;
  final String? note;

  @override
  List<Object?> get props => [orderId, nextStatus, note];
}

class OrdersHomeErrorDismissed extends OrdersHomeEvent {
  const OrdersHomeErrorDismissed();
}

class OrdersHomeOrdersStreamUpdated extends OrdersHomeEvent {
  const OrdersHomeOrdersStreamUpdated(this.orders);

  final List<OrderListItem> orders;

  @override
  List<Object?> get props => [orders];
}

class OrdersHomeConnectionChanged extends OrdersHomeEvent {
  const OrdersHomeConnectionChanged({required this.isOnline});

  final bool isOnline;

  @override
  List<Object?> get props => [isOnline];
}
