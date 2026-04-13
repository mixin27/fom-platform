import 'package:equatable/equatable.dart';

import '../../../orders/domain/entities/order_list_item.dart';
import '../../../orders/domain/entities/order_status.dart';
import '../../../orders/presentation/models/orders_home_tab.dart';

enum CustomerOrdersStatus { initial, loading, ready, error }

class CustomerOrdersState extends Equatable {
  const CustomerOrdersState({
    this.status = CustomerOrdersStatus.initial,
    this.shopId,
    this.shopName = 'My Shop',
    this.customerId,
    this.customerName = 'Customer',
    this.customerPhone = '',
    this.orders = const <OrderListItem>[],
    this.selectedTab = OrdersHomeTab.all,
    this.searchQuery = '',
    this.isRefreshing = false,
    this.errorMessage,
    this.lastRefreshedAt,
  });

  final CustomerOrdersStatus status;
  final String? shopId;
  final String shopName;
  final String? customerId;
  final String customerName;
  final String customerPhone;
  final List<OrderListItem> orders;
  final OrdersHomeTab selectedTab;
  final String searchQuery;
  final bool isRefreshing;
  final String? errorMessage;
  final DateTime? lastRefreshedAt;

  bool get hasShop => (shopId ?? '').trim().isNotEmpty;
  bool get hasOrders => orders.isNotEmpty;

  int countForTab(OrdersHomeTab tab) {
    final now = DateTime.now();

    switch (tab) {
      case OrdersHomeTab.all:
        return orders.length;
      case OrdersHomeTab.today:
        return orders.where((order) => _isSameDay(order.createdAt, now)).length;
      case OrdersHomeTab.pending:
        return orders.where((order) => order.status.isPending).length;
      case OrdersHomeTab.delivered:
        return orders
            .where((order) => order.status == OrderStatus.delivered)
            .length;
    }
  }

  int get todayRevenue {
    final now = DateTime.now();
    return orders
        .where((order) => _isSameDay(order.createdAt, now))
        .fold<int>(0, (sum, order) => sum + order.totalPrice);
  }

  List<OrderListItem> get filteredOrders {
    final query = searchQuery.trim().toLowerCase();

    return orders
        .where((order) {
          if (!_matchesTab(order, selectedTab)) {
            return false;
          }

          if (query.isEmpty) {
            return true;
          }

          final searchValues = <String>[
            order.orderNo,
            order.customerName,
            order.customerPhone,
            order.customerTownship ?? '',
            order.customerAddress ?? '',
            order.primaryProductSummary,
            ...order.items.map((item) => item.productName),
          ];

          return searchValues.any(
            (value) => value.toLowerCase().contains(query),
          );
        })
        .toList(growable: false);
  }

  CustomerOrdersState copyWith({
    CustomerOrdersStatus? status,
    String? shopId,
    String? shopName,
    String? customerId,
    String? customerName,
    String? customerPhone,
    List<OrderListItem>? orders,
    OrdersHomeTab? selectedTab,
    String? searchQuery,
    bool? isRefreshing,
    String? errorMessage,
    bool clearError = false,
    DateTime? lastRefreshedAt,
  }) {
    return CustomerOrdersState(
      status: status ?? this.status,
      shopId: shopId ?? this.shopId,
      shopName: shopName ?? this.shopName,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      orders: orders ?? this.orders,
      selectedTab: selectedTab ?? this.selectedTab,
      searchQuery: searchQuery ?? this.searchQuery,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastRefreshedAt: lastRefreshedAt ?? this.lastRefreshedAt,
    );
  }

  @override
  List<Object?> get props => [
    status,
    shopId,
    shopName,
    customerId,
    customerName,
    customerPhone,
    orders,
    selectedTab,
    searchQuery,
    isRefreshing,
    errorMessage,
    lastRefreshedAt,
  ];

  bool _matchesTab(OrderListItem order, OrdersHomeTab tab) {
    final now = DateTime.now();

    switch (tab) {
      case OrdersHomeTab.all:
        return true;
      case OrdersHomeTab.today:
        return _isSameDay(order.createdAt, now);
      case OrdersHomeTab.pending:
        return order.status.isPending;
      case OrdersHomeTab.delivered:
        return order.status == OrderStatus.delivered;
    }
  }
}

bool _isSameDay(DateTime left, DateTime right) {
  return left.year == right.year &&
      left.month == right.month &&
      left.day == right.day;
}
