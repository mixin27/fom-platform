import 'package:equatable/equatable.dart';

import '../../domain/entities/customer_list_item.dart';
import '../models/customers_home_tab.dart';

enum CustomersHomeStatus { initial, loading, ready, error }

class CustomersHomeState extends Equatable {
  const CustomersHomeState({
    this.status = CustomersHomeStatus.initial,
    this.shopId,
    this.shopName = 'My Shop',
    this.customers = const <CustomerListItem>[],
    this.selectedTab = CustomersHomeTab.all,
    this.searchQuery = '',
    this.isRefreshing = false,
    this.errorMessage,
    this.lastRefreshedAt,
  });

  final CustomersHomeStatus status;
  final String? shopId;
  final String shopName;
  final List<CustomerListItem> customers;
  final CustomersHomeTab selectedTab;
  final String searchQuery;
  final bool isRefreshing;
  final String? errorMessage;
  final DateTime? lastRefreshedAt;

  bool get hasShop => (shopId ?? '').trim().isNotEmpty;

  bool get hasCustomers => customers.isNotEmpty;

  int get totalCustomersCount => customers.length;

  int get vipCustomersCount => countForTab(CustomersHomeTab.vip);

  int get newThisWeekCustomersCount =>
      countForTab(CustomersHomeTab.newThisWeek);

  int countForTab(CustomersHomeTab tab) {
    return _customersForTab(tab).length;
  }

  List<CustomerListItem> get filteredCustomers {
    final query = searchQuery.trim().toLowerCase();
    final tabCustomers = _customersForTab(selectedTab);

    if (query.isEmpty) {
      return tabCustomers;
    }

    return tabCustomers
        .where((customer) {
          final values = <String>[
            customer.name,
            customer.phone,
            customer.township ?? '',
            customer.address ?? '',
            customer.notes ?? '',
            customer.favouriteItem ?? '',
          ];

          return values.any((value) => value.toLowerCase().contains(query));
        })
        .toList(growable: false);
  }

  List<String> get alphabetIndex {
    final letters =
        filteredCustomers
            .map((customer) => customer.firstLetter)
            .toSet()
            .toList(growable: false)
          ..sort();

    return letters;
  }

  CustomersHomeState copyWith({
    CustomersHomeStatus? status,
    String? shopId,
    String? shopName,
    List<CustomerListItem>? customers,
    CustomersHomeTab? selectedTab,
    String? searchQuery,
    bool? isRefreshing,
    String? errorMessage,
    bool clearError = false,
    DateTime? lastRefreshedAt,
  }) {
    return CustomersHomeState(
      status: status ?? this.status,
      shopId: shopId ?? this.shopId,
      shopName: shopName ?? this.shopName,
      customers: customers ?? this.customers,
      selectedTab: selectedTab ?? this.selectedTab,
      searchQuery: searchQuery ?? this.searchQuery,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastRefreshedAt: lastRefreshedAt ?? this.lastRefreshedAt,
    );
  }

  List<CustomerListItem> _customersForTab(CustomersHomeTab tab) {
    final sortedByName = <CustomerListItem>[...customers]
      ..sort(
        (left, right) =>
            left.name.toLowerCase().compareTo(right.name.toLowerCase()),
      );

    switch (tab) {
      case CustomersHomeTab.all:
        return sortedByName;
      case CustomersHomeTab.vip:
        return sortedByName
            .where((customer) => customer.isVip)
            .toList(growable: false);
      case CustomersHomeTab.topSpenders:
        final sortedBySpent = <CustomerListItem>[...customers]
          ..sort((left, right) {
            final spentCompare = right.totalSpent.compareTo(left.totalSpent);
            if (spentCompare != 0) {
              return spentCompare;
            }

            return left.name.toLowerCase().compareTo(right.name.toLowerCase());
          });

        return sortedBySpent;
      case CustomersHomeTab.newThisWeek:
        final newCustomers = sortedByName
            .where((customer) => customer.isNewThisWeek)
            .toList(growable: false);
        return newCustomers;
    }
  }

  @override
  List<Object?> get props => [
    status,
    shopId,
    shopName,
    customers,
    selectedTab,
    searchQuery,
    isRefreshing,
    errorMessage,
    lastRefreshedAt,
  ];
}
