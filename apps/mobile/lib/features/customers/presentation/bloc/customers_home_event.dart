import 'package:equatable/equatable.dart';

import '../../domain/entities/customer_list_item.dart';
import '../models/customers_home_tab.dart';

sealed class CustomersHomeEvent extends Equatable {
  const CustomersHomeEvent();

  @override
  List<Object?> get props => const [];
}

class CustomersHomeStarted extends CustomersHomeEvent {
  const CustomersHomeStarted({required this.shopId, required this.shopName});

  final String shopId;
  final String shopName;

  @override
  List<Object?> get props => [shopId, shopName];
}

class CustomersHomeRefreshRequested extends CustomersHomeEvent {
  const CustomersHomeRefreshRequested({this.silent = false});

  final bool silent;

  @override
  List<Object?> get props => [silent];
}

class CustomersHomeTabChanged extends CustomersHomeEvent {
  const CustomersHomeTabChanged(this.tab);

  final CustomersHomeTab tab;

  @override
  List<Object?> get props => [tab];
}

class CustomersHomeSearchChanged extends CustomersHomeEvent {
  const CustomersHomeSearchChanged(this.query);

  final String query;

  @override
  List<Object?> get props => [query];
}

class CustomersHomeCustomersStreamUpdated extends CustomersHomeEvent {
  const CustomersHomeCustomersStreamUpdated(this.customers);

  final List<CustomerListItem> customers;

  @override
  List<Object?> get props => [customers];
}

class CustomersHomeConnectionChanged extends CustomersHomeEvent {
  const CustomersHomeConnectionChanged({required this.isOnline});

  final bool isOnline;

  @override
  List<Object?> get props => [isOnline];
}

class CustomersHomeErrorDismissed extends CustomersHomeEvent {
  const CustomersHomeErrorDismissed();
}
