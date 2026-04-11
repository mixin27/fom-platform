import "package:equatable/equatable.dart";

import "../../domain/entities/order_details.dart";
import "../../domain/entities/order_list_item.dart";
import "../../domain/entities/order_status.dart";

enum OrderDetailsStatus { initial, loading, ready, error }

class OrderDetailsState extends Equatable {
  const OrderDetailsState({
    this.status = OrderDetailsStatus.initial,
    this.shopId,
    this.orderId,
    this.cachedOrder,
    this.orderDetails,
    this.isRefreshing = false,
    this.isUpdatingStatus = false,
    this.errorMessage,
    this.lastRefreshedAt,
  });

  final OrderDetailsStatus status;
  final String? shopId;
  final String? orderId;
  final OrderListItem? cachedOrder;
  final OrderDetails? orderDetails;
  final bool isRefreshing;
  final bool isUpdatingStatus;
  final String? errorMessage;
  final DateTime? lastRefreshedAt;

  bool get hasShop => (shopId ?? "").trim().isNotEmpty;

  bool get hasOrder => (orderId ?? "").trim().isNotEmpty;

  bool get hasData => cachedOrder != null || orderDetails != null;

  bool get isLoadingInitial => status == OrderDetailsStatus.loading && !hasData;

  OrderListItem? get effectiveOrder {
    return orderDetails?.toOrderListItem() ?? cachedOrder;
  }

  OrderStatus? get currentStatus {
    return orderDetails?.status ?? cachedOrder?.status;
  }

  OrderDetailsState copyWith({
    OrderDetailsStatus? status,
    String? shopId,
    String? orderId,
    OrderListItem? cachedOrder,
    bool clearCachedOrder = false,
    OrderDetails? orderDetails,
    bool clearOrderDetails = false,
    bool? isRefreshing,
    bool? isUpdatingStatus,
    String? errorMessage,
    bool clearError = false,
    DateTime? lastRefreshedAt,
  }) {
    return OrderDetailsState(
      status: status ?? this.status,
      shopId: shopId ?? this.shopId,
      orderId: orderId ?? this.orderId,
      cachedOrder: clearCachedOrder ? null : (cachedOrder ?? this.cachedOrder),
      orderDetails: clearOrderDetails
          ? null
          : (orderDetails ?? this.orderDetails),
      isRefreshing: isRefreshing ?? this.isRefreshing,
      isUpdatingStatus: isUpdatingStatus ?? this.isUpdatingStatus,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastRefreshedAt: lastRefreshedAt ?? this.lastRefreshedAt,
    );
  }

  @override
  List<Object?> get props => [
    status,
    shopId,
    orderId,
    cachedOrder,
    orderDetails,
    isRefreshing,
    isUpdatingStatus,
    errorMessage,
    lastRefreshedAt,
  ];
}
