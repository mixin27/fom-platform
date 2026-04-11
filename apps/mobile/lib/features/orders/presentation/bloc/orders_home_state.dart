import 'package:equatable/equatable.dart';

import '../../domain/entities/order_list_item.dart';
import '../../domain/entities/order_status.dart';
import '../models/orders_home_tab.dart';

enum OrdersHomeStatus { initial, loading, ready, error }

class OrdersHomeState extends Equatable {
  const OrdersHomeState({
    this.status = OrdersHomeStatus.initial,
    this.shopId,
    this.shopName = 'My Shop',
    this.orders = const <OrderListItem>[],
    this.selectedTab = OrdersHomeTab.all,
    this.searchQuery = '',
    this.isRefreshing = false,
    this.updatingOrderIds = const <String>[],
    this.errorMessage,
    this.lastRefreshedAt,
  });

  final OrdersHomeStatus status;
  final String? shopId;
  final String shopName;
  final List<OrderListItem> orders;
  final OrdersHomeTab selectedTab;
  final String searchQuery;
  final bool isRefreshing;
  final List<String> updatingOrderIds;
  final String? errorMessage;
  final DateTime? lastRefreshedAt;

  bool get hasShop => (shopId ?? '').trim().isNotEmpty;

  bool get hasOrders => orders.isNotEmpty;

  bool isOrderUpdating(String orderId) {
    return updatingOrderIds.contains(orderId);
  }

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

  int get todayOrdersCount => countForTab(OrdersHomeTab.today);

  int get pendingOrdersCount => countForTab(OrdersHomeTab.pending);

  int get deliveredOrdersCount => countForTab(OrdersHomeTab.delivered);

  int get todayRevenue {
    final now = DateTime.now();
    return orders
        .where((order) => _isSameDay(order.createdAt, now))
        .fold<int>(0, (sum, order) => sum + order.totalPrice);
  }

  int get todayOrdersDelta {
    final now = DateTime.now();
    final yesterday = now.subtract(const Duration(days: 1));

    final todayCount = orders
        .where((order) => _isSameDay(order.createdAt, now))
        .length;
    final yesterdayCount = orders
        .where((order) => _isSameDay(order.createdAt, yesterday))
        .length;

    return todayCount - yesterdayCount;
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

  OrdersHomeState copyWith({
    OrdersHomeStatus? status,
    String? shopId,
    String? shopName,
    List<OrderListItem>? orders,
    OrdersHomeTab? selectedTab,
    String? searchQuery,
    bool? isRefreshing,
    List<String>? updatingOrderIds,
    String? errorMessage,
    bool clearError = false,
    DateTime? lastRefreshedAt,
  }) {
    return OrdersHomeState(
      status: status ?? this.status,
      shopId: shopId ?? this.shopId,
      shopName: shopName ?? this.shopName,
      orders: orders ?? this.orders,
      selectedTab: selectedTab ?? this.selectedTab,
      searchQuery: searchQuery ?? this.searchQuery,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      updatingOrderIds: updatingOrderIds ?? this.updatingOrderIds,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastRefreshedAt: lastRefreshedAt ?? this.lastRefreshedAt,
    );
  }

  @override
  List<Object?> get props => [
    status,
    shopId,
    shopName,
    orders,
    selectedTab,
    searchQuery,
    isRefreshing,
    updatingOrderIds,
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
