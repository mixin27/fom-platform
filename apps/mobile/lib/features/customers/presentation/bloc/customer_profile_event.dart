import 'package:equatable/equatable.dart';

import '../../domain/entities/customer_list_item.dart';

sealed class CustomerProfileEvent extends Equatable {
  const CustomerProfileEvent();

  @override
  List<Object?> get props => const [];
}

class CustomerProfileStarted extends CustomerProfileEvent {
  const CustomerProfileStarted({
    required this.shopId,
    required this.shopName,
    required this.customerId,
  });

  final String shopId;
  final String shopName;
  final String customerId;

  @override
  List<Object?> get props => [shopId, shopName, customerId];
}

class CustomerProfileRefreshRequested extends CustomerProfileEvent {
  const CustomerProfileRefreshRequested({this.silent = false});

  final bool silent;

  @override
  List<Object?> get props => [silent];
}

class CustomerProfileCustomerStreamUpdated extends CustomerProfileEvent {
  const CustomerProfileCustomerStreamUpdated(this.customer);

  final CustomerListItem? customer;

  @override
  List<Object?> get props => [customer];
}

class CustomerProfileConnectionChanged extends CustomerProfileEvent {
  const CustomerProfileConnectionChanged({required this.isOnline});

  final bool isOnline;

  @override
  List<Object?> get props => [isOnline];
}

class CustomerProfileErrorDismissed extends CustomerProfileEvent {
  const CustomerProfileErrorDismissed();
}
