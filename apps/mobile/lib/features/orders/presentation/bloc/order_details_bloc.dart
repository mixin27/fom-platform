import "dart:async";

import "package:app_logger/app_logger.dart";
import "package:flutter_bloc/flutter_bloc.dart";

import "../../domain/entities/order_list_item.dart";
import "../../domain/usecases/get_order_details_use_case.dart";
import "../../domain/usecases/update_order_status_use_case.dart";
import "../../domain/usecases/watch_order_by_id_use_case.dart";
import "order_details_event.dart";
import "order_details_state.dart";

class OrderDetailsBloc extends Bloc<OrderDetailsEvent, OrderDetailsState>
    with LoggerMixin {
  OrderDetailsBloc({
    required WatchOrderByIdUseCase watchOrderByIdUseCase,
    required GetOrderDetailsUseCase getOrderDetailsUseCase,
    required UpdateOrderStatusUseCase updateOrderStatusUseCase,
    AppLogger? logger,
  }) : _watchOrderByIdUseCase = watchOrderByIdUseCase,
       _getOrderDetailsUseCase = getOrderDetailsUseCase,
       _updateOrderStatusUseCase = updateOrderStatusUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const OrderDetailsState()) {
    on<OrderDetailsStarted>(_onStarted);
    on<OrderDetailsRefreshRequested>(_onRefreshRequested);
    on<OrderDetailsStatusChangeRequested>(_onStatusChangeRequested);
    on<OrderDetailsCachedOrderUpdated>(_onCachedOrderUpdated);
    on<OrderDetailsErrorDismissed>(_onErrorDismissed);
  }

  final WatchOrderByIdUseCase _watchOrderByIdUseCase;
  final GetOrderDetailsUseCase _getOrderDetailsUseCase;
  final UpdateOrderStatusUseCase _updateOrderStatusUseCase;
  final AppLogger _logger;

  StreamSubscription<OrderListItem?>? _orderSubscription;
  bool _isRefreshInFlight = false;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext("OrderDetailsBloc");

  Future<void> _onStarted(
    OrderDetailsStarted event,
    Emitter<OrderDetailsState> emit,
  ) async {
    final shopId = event.shopId.trim();
    final orderId = event.orderId.trim();

    if (shopId.isEmpty || orderId.isEmpty) {
      emit(
        state.copyWith(
          status: OrderDetailsStatus.error,
          shopId: shopId,
          orderId: orderId,
          errorMessage: "Order access is not available for this account.",
        ),
      );
      return;
    }

    emit(
      state.copyWith(
        status: OrderDetailsStatus.loading,
        shopId: shopId,
        orderId: orderId,
        clearError: true,
      ),
    );

    await _orderSubscription?.cancel();
    _orderSubscription = _watchOrderByIdUseCase(orderId: orderId).listen(
      (order) => add(OrderDetailsCachedOrderUpdated(order)),
      onError: (Object error, StackTrace stackTrace) {
        log.error(
          "Order cache stream failed",
          error: error,
          stackTrace: stackTrace,
        );
      },
    );

    add(const OrderDetailsRefreshRequested());
  }

  Future<void> _onRefreshRequested(
    OrderDetailsRefreshRequested event,
    Emitter<OrderDetailsState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    final orderId = state.orderId?.trim();

    if (shopId == null ||
        shopId.isEmpty ||
        orderId == null ||
        orderId.isEmpty ||
        _isRefreshInFlight) {
      return;
    }

    _isRefreshInFlight = true;

    if (!event.silent) {
      emit(
        state.copyWith(
          status: state.hasData
              ? OrderDetailsStatus.ready
              : OrderDetailsStatus.loading,
          isRefreshing: true,
          clearError: true,
        ),
      );
    }

    final result = await _getOrderDetailsUseCase(
      GetOrderDetailsParams(shopId: shopId, orderId: orderId),
    );

    if (isClosed) {
      _isRefreshInFlight = false;
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: state.hasData
                ? OrderDetailsStatus.ready
                : OrderDetailsStatus.error,
            isRefreshing: false,
            errorMessage: failure.message,
          ),
        );
      },
      (details) {
        emit(
          state.copyWith(
            status: OrderDetailsStatus.ready,
            orderDetails: details,
            isRefreshing: false,
            clearError: true,
            lastRefreshedAt: DateTime.now(),
          ),
        );
      },
    );

    _isRefreshInFlight = false;
  }

  Future<void> _onStatusChangeRequested(
    OrderDetailsStatusChangeRequested event,
    Emitter<OrderDetailsState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    final orderId = state.orderId?.trim();

    if (shopId == null ||
        shopId.isEmpty ||
        orderId == null ||
        orderId.isEmpty ||
        state.isUpdatingStatus) {
      return;
    }

    emit(state.copyWith(isUpdatingStatus: true, clearError: true));

    final result = await _updateOrderStatusUseCase(
      UpdateOrderStatusParams(
        shopId: shopId,
        orderId: orderId,
        status: event.nextStatus,
        note: event.note,
      ),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            isUpdatingStatus: false,
            errorMessage: failure.message,
          ),
        );
      },
      (_) {
        emit(
          state.copyWith(
            isUpdatingStatus: false,
            clearError: true,
            lastRefreshedAt: DateTime.now(),
          ),
        );
        add(const OrderDetailsRefreshRequested(silent: true));
      },
    );
  }

  void _onCachedOrderUpdated(
    OrderDetailsCachedOrderUpdated event,
    Emitter<OrderDetailsState> emit,
  ) {
    emit(
      state.copyWith(
        status: state.status == OrderDetailsStatus.initial
            ? OrderDetailsStatus.loading
            : state.status == OrderDetailsStatus.error && event.order != null
            ? OrderDetailsStatus.ready
            : state.status,
        cachedOrder: event.order,
      ),
    );
  }

  void _onErrorDismissed(
    OrderDetailsErrorDismissed event,
    Emitter<OrderDetailsState> emit,
  ) {
    emit(state.copyWith(clearError: true));
  }

  @override
  Future<void> close() async {
    await _orderSubscription?.cancel();
    return super.close();
  }
}
