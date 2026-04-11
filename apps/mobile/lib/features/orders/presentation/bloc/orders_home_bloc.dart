import "dart:async";

import "package:app_logger/app_logger.dart";
import "package:app_network/app_network.dart";
import "package:flutter_bloc/flutter_bloc.dart";

import "../../domain/entities/order_list_item.dart";
import "../../domain/usecases/refresh_orders_use_case.dart";
import "../../domain/usecases/update_order_status_use_case.dart";
import "../../domain/usecases/watch_orders_use_case.dart";
import "orders_home_event.dart";
import "orders_home_state.dart";

class OrdersHomeBloc extends Bloc<OrdersHomeEvent, OrdersHomeState>
    with LoggerMixin {
  OrdersHomeBloc({
    required WatchOrdersUseCase watchOrdersUseCase,
    required RefreshOrdersUseCase refreshOrdersUseCase,
    required UpdateOrderStatusUseCase updateOrderStatusUseCase,
    required NetworkConnectionService networkConnectionService,
    AppLogger? logger,
  }) : _watchOrdersUseCase = watchOrdersUseCase,
       _refreshOrdersUseCase = refreshOrdersUseCase,
       _updateOrderStatusUseCase = updateOrderStatusUseCase,
       _networkConnectionService = networkConnectionService,
       _logger = logger ?? AppLogger(enabled: false),
       super(const OrdersHomeState()) {
    on<OrdersHomeStarted>(_onStarted);
    on<OrdersHomeRefreshRequested>(_onRefreshRequested);
    on<OrdersHomeTabChanged>(_onTabChanged);
    on<OrdersHomeSearchChanged>(_onSearchChanged);
    on<OrdersHomeOrderStatusChangeRequested>(_onOrderStatusChangeRequested);
    on<OrdersHomeOrdersStreamUpdated>(_onOrdersStreamUpdated);
    on<OrdersHomeConnectionChanged>(_onConnectionChanged);
    on<OrdersHomeErrorDismissed>(_onErrorDismissed);
  }

  static const Duration _backgroundRefreshInterval = Duration(minutes: 2);

  final WatchOrdersUseCase _watchOrdersUseCase;
  final RefreshOrdersUseCase _refreshOrdersUseCase;
  final UpdateOrderStatusUseCase _updateOrderStatusUseCase;
  final NetworkConnectionService _networkConnectionService;
  final AppLogger _logger;

  StreamSubscription<List<OrderListItem>>? _ordersSubscription;
  StreamSubscription<NetworkConnectionStatus>? _connectionSubscription;
  Timer? _backgroundRefreshTimer;
  bool _isRefreshingInFlight = false;
  bool _wasOnline = false;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext("OrdersHomeBloc");

  Future<void> _onStarted(
    OrdersHomeStarted event,
    Emitter<OrdersHomeState> emit,
  ) async {
    final normalizedShopId = event.shopId.trim();
    final normalizedShopName = event.shopName.trim().isEmpty
        ? "My Shop"
        : event.shopName.trim();

    if (normalizedShopId.isEmpty) {
      emit(
        state.copyWith(
          status: OrdersHomeStatus.error,
          shopId: "",
          shopName: normalizedShopName,
          errorMessage: "Shop access is not available for this account.",
        ),
      );
      return;
    }

    final shouldRestartOrdersStream =
        state.shopId != normalizedShopId || _ordersSubscription == null;

    emit(
      state.copyWith(
        status: state.status == OrdersHomeStatus.initial
            ? OrdersHomeStatus.loading
            : state.status,
        shopId: normalizedShopId,
        shopName: normalizedShopName,
        clearError: true,
      ),
    );

    if (shouldRestartOrdersStream) {
      await _ordersSubscription?.cancel();
      _ordersSubscription = _watchOrdersUseCase(shopId: normalizedShopId)
          .listen(
            (orders) => add(OrdersHomeOrdersStreamUpdated(orders)),
            onError: (Object error, StackTrace stackTrace) {
              log.error(
                "Orders stream error",
                error: error,
                stackTrace: stackTrace,
              );
            },
          );
    }

    _startConnectivitySubscription();
    _startBackgroundRefreshTimer();
    add(const OrdersHomeRefreshRequested());
  }

  Future<void> _onRefreshRequested(
    OrdersHomeRefreshRequested event,
    Emitter<OrdersHomeState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    if (shopId == null || shopId.isEmpty || _isRefreshingInFlight) {
      return;
    }

    if (event.silent && !_networkConnectionService.currentStatus.isOnline) {
      return;
    }

    _isRefreshingInFlight = true;

    if (!event.silent) {
      emit(
        state.copyWith(
          status: state.status == OrdersHomeStatus.initial
              ? OrdersHomeStatus.loading
              : state.status,
          isRefreshing: true,
          clearError: true,
        ),
      );
    }

    final result = await _refreshOrdersUseCase(
      RefreshOrdersParams(shopId: shopId),
    );

    if (isClosed) {
      _isRefreshingInFlight = false;
      return;
    }

    result.fold(
      (failure) {
        if (event.silent && state.hasOrders) {
          emit(state.copyWith(isRefreshing: false));
          return;
        }

        emit(
          state.copyWith(
            status: state.hasOrders
                ? OrdersHomeStatus.ready
                : OrdersHomeStatus.error,
            isRefreshing: false,
            errorMessage: failure.message,
          ),
        );
      },
      (_) {
        emit(
          state.copyWith(
            status: OrdersHomeStatus.ready,
            isRefreshing: false,
            clearError: true,
            lastRefreshedAt: DateTime.now(),
          ),
        );
      },
    );

    _isRefreshingInFlight = false;
  }

  Future<void> _onOrderStatusChangeRequested(
    OrdersHomeOrderStatusChangeRequested event,
    Emitter<OrdersHomeState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    if (shopId == null || shopId.isEmpty) {
      return;
    }

    if (state.isOrderUpdating(event.orderId)) {
      return;
    }

    final updatingOrderIds = <String>[...state.updatingOrderIds, event.orderId];
    emit(state.copyWith(updatingOrderIds: updatingOrderIds, clearError: true));

    final result = await _updateOrderStatusUseCase(
      UpdateOrderStatusParams(
        shopId: shopId,
        orderId: event.orderId,
        status: event.nextStatus,
        note: event.note,
      ),
    );

    if (isClosed) {
      return;
    }

    final nextUpdatingOrderIds = <String>[
      ...state.updatingOrderIds.where((id) => id != event.orderId),
    ];

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            updatingOrderIds: nextUpdatingOrderIds,
            errorMessage: failure.message,
          ),
        );
      },
      (_) {
        emit(
          state.copyWith(
            updatingOrderIds: nextUpdatingOrderIds,
            clearError: true,
            lastRefreshedAt: DateTime.now(),
          ),
        );
      },
    );
  }

  void _onTabChanged(
    OrdersHomeTabChanged event,
    Emitter<OrdersHomeState> emit,
  ) {
    if (event.tab == state.selectedTab) {
      return;
    }

    emit(state.copyWith(selectedTab: event.tab));
  }

  void _onSearchChanged(
    OrdersHomeSearchChanged event,
    Emitter<OrdersHomeState> emit,
  ) {
    if (event.query == state.searchQuery) {
      return;
    }

    emit(state.copyWith(searchQuery: event.query));
  }

  void _onOrdersStreamUpdated(
    OrdersHomeOrdersStreamUpdated event,
    Emitter<OrdersHomeState> emit,
  ) {
    emit(state.copyWith(status: OrdersHomeStatus.ready, orders: event.orders));
  }

  void _onConnectionChanged(
    OrdersHomeConnectionChanged event,
    Emitter<OrdersHomeState> emit,
  ) {
    if (event.isOnline && !_wasOnline && state.hasShop) {
      add(const OrdersHomeRefreshRequested(silent: true));
    }

    _wasOnline = event.isOnline;
  }

  void _onErrorDismissed(
    OrdersHomeErrorDismissed event,
    Emitter<OrdersHomeState> emit,
  ) {
    emit(state.copyWith(clearError: true));
  }

  void _startConnectivitySubscription() {
    if (_connectionSubscription != null) {
      return;
    }

    _wasOnline = _networkConnectionService.currentStatus.isOnline;
    _connectionSubscription = _networkConnectionService.statusStream.listen(
      (status) => add(OrdersHomeConnectionChanged(isOnline: status.isOnline)),
      onError: (Object error, StackTrace stackTrace) {
        log.error(
          "Network connection status stream failed",
          error: error,
          stackTrace: stackTrace,
        );
      },
    );
  }

  void _startBackgroundRefreshTimer() {
    _backgroundRefreshTimer?.cancel();
    _backgroundRefreshTimer = Timer.periodic(_backgroundRefreshInterval, (_) {
      if (isClosed || !state.hasShop) {
        return;
      }

      add(const OrdersHomeRefreshRequested(silent: true));
    });
  }

  @override
  Future<void> close() async {
    _backgroundRefreshTimer?.cancel();
    await _ordersSubscription?.cancel();
    await _connectionSubscription?.cancel();
    return super.close();
  }
}
