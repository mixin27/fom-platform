import 'dart:async';

import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/fetch_customer_orders_use_case.dart';
import 'customer_orders_event.dart';
import 'customer_orders_state.dart';

class CustomerOrdersBloc extends Bloc<CustomerOrdersEvent, CustomerOrdersState>
    with LoggerMixin {
  CustomerOrdersBloc({
    required FetchCustomerOrdersUseCase fetchCustomerOrdersUseCase,
    required NetworkConnectionService networkConnectionService,
    AppLogger? logger,
  }) : _fetchCustomerOrdersUseCase = fetchCustomerOrdersUseCase,
       _networkConnectionService = networkConnectionService,
       _logger = logger ?? AppLogger(enabled: false),
       super(const CustomerOrdersState()) {
    on<CustomerOrdersStarted>(_onStarted);
    on<CustomerOrdersRefreshRequested>(_onRefreshRequested);
    on<CustomerOrdersTabChanged>(_onTabChanged);
    on<CustomerOrdersSearchChanged>(_onSearchChanged);
    on<CustomerOrdersConnectionChanged>(_onConnectionChanged);
    on<CustomerOrdersErrorDismissed>(_onErrorDismissed);
  }

  final FetchCustomerOrdersUseCase _fetchCustomerOrdersUseCase;
  final NetworkConnectionService _networkConnectionService;
  final AppLogger _logger;

  StreamSubscription<NetworkConnectionStatus>? _connectionSubscription;
  bool _isRefreshingInFlight = false;
  bool _wasOnline = false;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('CustomerOrdersBloc');

  Future<void> _onStarted(
    CustomerOrdersStarted event,
    Emitter<CustomerOrdersState> emit,
  ) async {
    final normalizedShopId = event.shopId.trim();
    final normalizedCustomerId = event.customerId.trim();

    if (normalizedShopId.isEmpty || normalizedCustomerId.isEmpty) {
      emit(
        state.copyWith(
          status: CustomerOrdersStatus.error,
          shopId: normalizedShopId,
          customerId: normalizedCustomerId,
          customerName: event.customerName.trim().isEmpty
              ? 'Customer'
              : event.customerName.trim(),
          customerPhone: event.customerPhone.trim(),
          errorMessage: 'Customer orders are unavailable right now.',
        ),
      );
      return;
    }

    emit(
      state.copyWith(
        status: CustomerOrdersStatus.loading,
        shopId: normalizedShopId,
        shopName: event.shopName.trim().isEmpty
            ? 'My Shop'
            : event.shopName.trim(),
        customerId: normalizedCustomerId,
        customerName: event.customerName.trim().isEmpty
            ? 'Customer'
            : event.customerName.trim(),
        customerPhone: event.customerPhone.trim(),
        clearError: true,
      ),
    );

    _startConnectivitySubscription();
    add(const CustomerOrdersRefreshRequested());
  }

  Future<void> _onRefreshRequested(
    CustomerOrdersRefreshRequested event,
    Emitter<CustomerOrdersState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    final customerId = state.customerId?.trim();

    if (shopId == null ||
        shopId.isEmpty ||
        customerId == null ||
        customerId.isEmpty ||
        _isRefreshingInFlight) {
      return;
    }

    if (event.silent && !_networkConnectionService.currentStatus.isOnline) {
      return;
    }

    _isRefreshingInFlight = true;

    if (!event.silent) {
      emit(
        state.copyWith(
          status: state.hasOrders
              ? CustomerOrdersStatus.ready
              : CustomerOrdersStatus.loading,
          isRefreshing: true,
          clearError: true,
        ),
      );
    }

    final result = await _fetchCustomerOrdersUseCase(
      FetchCustomerOrdersParams(shopId: shopId, customerId: customerId),
    );

    if (isClosed) {
      _isRefreshingInFlight = false;
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: state.hasOrders
                ? CustomerOrdersStatus.ready
                : CustomerOrdersStatus.error,
            isRefreshing: false,
            errorMessage: failure.message,
          ),
        );
      },
      (orders) {
        emit(
          state.copyWith(
            status: CustomerOrdersStatus.ready,
            orders: orders,
            isRefreshing: false,
            clearError: true,
            lastRefreshedAt: DateTime.now(),
          ),
        );
      },
    );

    _isRefreshingInFlight = false;
  }

  void _onTabChanged(
    CustomerOrdersTabChanged event,
    Emitter<CustomerOrdersState> emit,
  ) {
    if (event.tab == state.selectedTab) {
      return;
    }

    emit(state.copyWith(selectedTab: event.tab));
  }

  void _onSearchChanged(
    CustomerOrdersSearchChanged event,
    Emitter<CustomerOrdersState> emit,
  ) {
    if (event.query == state.searchQuery) {
      return;
    }

    emit(state.copyWith(searchQuery: event.query));
  }

  void _onConnectionChanged(
    CustomerOrdersConnectionChanged event,
    Emitter<CustomerOrdersState> emit,
  ) {
    if (event.isOnline && !_wasOnline && state.hasShop) {
      add(const CustomerOrdersRefreshRequested(silent: true));
    }

    _wasOnline = event.isOnline;
  }

  void _onErrorDismissed(
    CustomerOrdersErrorDismissed event,
    Emitter<CustomerOrdersState> emit,
  ) {
    emit(state.copyWith(clearError: true));
  }

  void _startConnectivitySubscription() {
    if (_connectionSubscription != null) {
      return;
    }

    _wasOnline = _networkConnectionService.currentStatus.isOnline;
    _connectionSubscription = _networkConnectionService.statusStream.listen(
      (status) =>
          add(CustomerOrdersConnectionChanged(isOnline: status.isOnline)),
      onError: (Object error, StackTrace stackTrace) {
        log.error(
          'Network connection status stream failed',
          error: error,
          stackTrace: stackTrace,
        );
      },
    );
  }

  @override
  Future<void> close() async {
    await _connectionSubscription?.cancel();
    return super.close();
  }
}
