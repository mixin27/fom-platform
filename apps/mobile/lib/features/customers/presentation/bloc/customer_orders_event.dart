import 'package:equatable/equatable.dart';

import '../../../orders/presentation/models/orders_home_tab.dart';

sealed class CustomerOrdersEvent extends Equatable {
  const CustomerOrdersEvent();

  @override
  List<Object?> get props => const [];
}

class CustomerOrdersStarted extends CustomerOrdersEvent {
  const CustomerOrdersStarted({
    required this.shopId,
    required this.shopName,
    required this.customerId,
    required this.customerName,
    required this.customerPhone,
  });

  final String shopId;
  final String shopName;
  final String customerId;
  final String customerName;
  final String customerPhone;

  @override
  List<Object?> get props => [
    shopId,
    shopName,
    customerId,
    customerName,
    customerPhone,
  ];
}

class CustomerOrdersRefreshRequested extends CustomerOrdersEvent {
  const CustomerOrdersRefreshRequested({this.silent = false});

  final bool silent;

  @override
  List<Object?> get props => [silent];
}

class CustomerOrdersTabChanged extends CustomerOrdersEvent {
  const CustomerOrdersTabChanged(this.tab);

  final OrdersHomeTab tab;

  @override
  List<Object?> get props => [tab];
}

class CustomerOrdersSearchChanged extends CustomerOrdersEvent {
  const CustomerOrdersSearchChanged(this.query);

  final String query;

  @override
  List<Object?> get props => [query];
}

class CustomerOrdersConnectionChanged extends CustomerOrdersEvent {
  const CustomerOrdersConnectionChanged({required this.isOnline});

  final bool isOnline;

  @override
  List<Object?> get props => [isOnline];
}

class CustomerOrdersErrorDismissed extends CustomerOrdersEvent {
  const CustomerOrdersErrorDismissed();
}
