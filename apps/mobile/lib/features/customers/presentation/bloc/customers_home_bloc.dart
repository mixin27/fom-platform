import 'dart:async';

import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/customer_list_item.dart';
import '../../domain/usecases/refresh_customers_use_case.dart';
import '../../domain/usecases/watch_customers_use_case.dart';
import 'customers_home_event.dart';
import 'customers_home_state.dart';

class CustomersHomeBloc extends Bloc<CustomersHomeEvent, CustomersHomeState>
    with LoggerMixin {
  CustomersHomeBloc({
    required WatchCustomersUseCase watchCustomersUseCase,
    required RefreshCustomersUseCase refreshCustomersUseCase,
    required NetworkConnectionService networkConnectionService,
    AppLogger? logger,
  }) : _watchCustomersUseCase = watchCustomersUseCase,
       _refreshCustomersUseCase = refreshCustomersUseCase,
       _networkConnectionService = networkConnectionService,
       _logger = logger ?? AppLogger(enabled: false),
       super(const CustomersHomeState()) {
    on<CustomersHomeStarted>(_onStarted);
    on<CustomersHomeRefreshRequested>(_onRefreshRequested);
    on<CustomersHomeTabChanged>(_onTabChanged);
    on<CustomersHomeSearchChanged>(_onSearchChanged);
    on<CustomersHomeCustomersStreamUpdated>(_onCustomersStreamUpdated);
    on<CustomersHomeConnectionChanged>(_onConnectionChanged);
    on<CustomersHomeErrorDismissed>(_onErrorDismissed);
  }

  static const Duration _backgroundRefreshInterval = Duration(minutes: 2);

  final WatchCustomersUseCase _watchCustomersUseCase;
  final RefreshCustomersUseCase _refreshCustomersUseCase;
  final NetworkConnectionService _networkConnectionService;
  final AppLogger _logger;

  StreamSubscription<List<CustomerListItem>>? _customersSubscription;
  StreamSubscription<NetworkConnectionStatus>? _connectionSubscription;
  Timer? _backgroundRefreshTimer;
  bool _isRefreshingInFlight = false;
  bool _wasOnline = false;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('CustomersHomeBloc');

  Future<void> _onStarted(
    CustomersHomeStarted event,
    Emitter<CustomersHomeState> emit,
  ) async {
    final normalizedShopId = event.shopId.trim();
    final normalizedShopName = event.shopName.trim().isEmpty
        ? 'My Shop'
        : event.shopName.trim();

    if (normalizedShopId.isEmpty) {
      emit(
        state.copyWith(
          status: CustomersHomeStatus.error,
          shopId: '',
          shopName: normalizedShopName,
          errorMessage: 'Shop access is not available for this account.',
        ),
      );
      return;
    }

    log.info("Starting customers home for shop=$normalizedShopId");

    final shouldRestartCustomersStream =
        state.shopId != normalizedShopId || _customersSubscription == null;

    emit(
      state.copyWith(
        status: state.status == CustomersHomeStatus.initial
            ? CustomersHomeStatus.loading
            : state.status,
        shopId: normalizedShopId,
        shopName: normalizedShopName,
        clearError: true,
      ),
    );

    if (shouldRestartCustomersStream) {
      await _customersSubscription?.cancel();
      _customersSubscription = _watchCustomersUseCase(shopId: normalizedShopId)
          .listen(
            (customers) => add(CustomersHomeCustomersStreamUpdated(customers)),
            onError: (Object error, StackTrace stackTrace) {
              log.error(
                'Customers stream error',
                error: error,
                stackTrace: stackTrace,
              );
            },
          );
    }

    _startConnectivitySubscription();
    _startBackgroundRefreshTimer();
    add(const CustomersHomeRefreshRequested());
  }

  Future<void> _onRefreshRequested(
    CustomersHomeRefreshRequested event,
    Emitter<CustomersHomeState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    if (shopId == null || shopId.isEmpty || _isRefreshingInFlight) {
      return;
    }

    if (event.silent && !_networkConnectionService.currentStatus.isOnline) {
      return;
    }

    if (!event.silent) {
      log.info("Refreshing customers for shop=$shopId");
    }

    _isRefreshingInFlight = true;

    if (!event.silent) {
      emit(
        state.copyWith(
          status: state.status == CustomersHomeStatus.initial
              ? CustomersHomeStatus.loading
              : state.status,
          isRefreshing: true,
          clearError: true,
        ),
      );
    }

    final result = await _refreshCustomersUseCase(
      RefreshCustomersParams(shopId: shopId),
    );

    if (isClosed) {
      _isRefreshingInFlight = false;
      return;
    }

    result.fold(
      (failure) {
        if (event.silent && state.hasCustomers) {
          emit(state.copyWith(isRefreshing: false));
          return;
        }

        emit(
          state.copyWith(
            status: state.hasCustomers
                ? CustomersHomeStatus.ready
                : CustomersHomeStatus.error,
            isRefreshing: false,
            errorMessage: failure.message,
          ),
        );
      },
      (_) {
        log.info("Customers refreshed successfully for shop=$shopId");
        emit(
          state.copyWith(
            status: CustomersHomeStatus.ready,
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
    CustomersHomeTabChanged event,
    Emitter<CustomersHomeState> emit,
  ) {
    if (event.tab == state.selectedTab) {
      return;
    }

    emit(state.copyWith(selectedTab: event.tab));
  }

  void _onSearchChanged(
    CustomersHomeSearchChanged event,
    Emitter<CustomersHomeState> emit,
  ) {
    if (event.query == state.searchQuery) {
      return;
    }

    emit(state.copyWith(searchQuery: event.query));
  }

  void _onCustomersStreamUpdated(
    CustomersHomeCustomersStreamUpdated event,
    Emitter<CustomersHomeState> emit,
  ) {
    log.debug("Customers stream update: ${event.customers.length} records");
    emit(
      state.copyWith(
        status: CustomersHomeStatus.ready,
        customers: event.customers,
      ),
    );
  }

  void _onConnectionChanged(
    CustomersHomeConnectionChanged event,
    Emitter<CustomersHomeState> emit,
  ) {
    if (event.isOnline && !_wasOnline && state.hasShop) {
      log.info("Network restored. Triggering silent customers refresh.");
      add(const CustomersHomeRefreshRequested(silent: true));
    }

    _wasOnline = event.isOnline;
  }

  void _onErrorDismissed(
    CustomersHomeErrorDismissed event,
    Emitter<CustomersHomeState> emit,
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
          add(CustomersHomeConnectionChanged(isOnline: status.isOnline)),
      onError: (Object error, StackTrace stackTrace) {
        log.error(
          'Network connection status stream failed',
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

      add(const CustomersHomeRefreshRequested(silent: true));
    });
  }

  @override
  Future<void> close() async {
    _backgroundRefreshTimer?.cancel();
    await _customersSubscription?.cancel();
    await _connectionSubscription?.cancel();
    return super.close();
  }
}
