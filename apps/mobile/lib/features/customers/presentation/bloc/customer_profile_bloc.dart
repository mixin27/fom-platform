import 'dart:async';

import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/customer_list_item.dart';
import '../../domain/usecases/refresh_customer_detail_use_case.dart';
import '../../domain/usecases/watch_customer_use_case.dart';
import 'customer_profile_event.dart';
import 'customer_profile_state.dart';

class CustomerProfileBloc
    extends Bloc<CustomerProfileEvent, CustomerProfileState>
    with LoggerMixin {
  CustomerProfileBloc({
    required WatchCustomerUseCase watchCustomerUseCase,
    required RefreshCustomerDetailUseCase refreshCustomerDetailUseCase,
    required NetworkConnectionService networkConnectionService,
    AppLogger? logger,
  }) : _watchCustomerUseCase = watchCustomerUseCase,
       _refreshCustomerDetailUseCase = refreshCustomerDetailUseCase,
       _networkConnectionService = networkConnectionService,
       _logger = logger ?? AppLogger(enabled: false),
       super(const CustomerProfileState()) {
    on<CustomerProfileStarted>(_onStarted);
    on<CustomerProfileRefreshRequested>(_onRefreshRequested);
    on<CustomerProfileCustomerStreamUpdated>(_onCustomerStreamUpdated);
    on<CustomerProfileConnectionChanged>(_onConnectionChanged);
    on<CustomerProfileErrorDismissed>(_onErrorDismissed);
  }

  final WatchCustomerUseCase _watchCustomerUseCase;
  final RefreshCustomerDetailUseCase _refreshCustomerDetailUseCase;
  final NetworkConnectionService _networkConnectionService;
  final AppLogger _logger;

  StreamSubscription<CustomerListItem?>? _customerSubscription;
  StreamSubscription<NetworkConnectionStatus>? _connectionSubscription;
  bool _isRefreshingInFlight = false;
  bool _wasOnline = false;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('CustomerProfileBloc');

  Future<void> _onStarted(
    CustomerProfileStarted event,
    Emitter<CustomerProfileState> emit,
  ) async {
    final normalizedShopId = event.shopId.trim();
    final normalizedShopName = event.shopName.trim().isEmpty
        ? 'My Shop'
        : event.shopName.trim();
    final normalizedCustomerId = event.customerId.trim();

    if (normalizedShopId.isEmpty || normalizedCustomerId.isEmpty) {
      emit(
        state.copyWith(
          status: CustomerProfileStatus.error,
          shopId: normalizedShopId,
          shopName: normalizedShopName,
          customerId: normalizedCustomerId,
          errorMessage: 'Customer profile is not available.',
        ),
      );
      return;
    }

    final shouldRestartStream =
        state.shopId != normalizedShopId ||
        state.customerId != normalizedCustomerId ||
        _customerSubscription == null;

    emit(
      state.copyWith(
        status: state.status == CustomerProfileStatus.initial
            ? CustomerProfileStatus.loading
            : state.status,
        shopId: normalizedShopId,
        shopName: normalizedShopName,
        customerId: normalizedCustomerId,
        clearError: true,
      ),
    );

    if (shouldRestartStream) {
      await _customerSubscription?.cancel();
      _customerSubscription =
          _watchCustomerUseCase(
            shopId: normalizedShopId,
            customerId: normalizedCustomerId,
          ).listen(
            (customer) => add(CustomerProfileCustomerStreamUpdated(customer)),
            onError: (Object error, StackTrace stackTrace) {
              log.error(
                'Customer profile stream error',
                error: error,
                stackTrace: stackTrace,
              );
            },
          );
    }

    _startConnectivitySubscription();
    add(const CustomerProfileRefreshRequested());
  }

  Future<void> _onRefreshRequested(
    CustomerProfileRefreshRequested event,
    Emitter<CustomerProfileState> emit,
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
          status: state.status == CustomerProfileStatus.initial
              ? CustomerProfileStatus.loading
              : state.status,
          isRefreshing: true,
          clearError: true,
        ),
      );
    }

    final result = await _refreshCustomerDetailUseCase(
      RefreshCustomerDetailParams(shopId: shopId, customerId: customerId),
    );

    if (isClosed) {
      _isRefreshingInFlight = false;
      return;
    }

    result.fold(
      (failure) {
        if (event.silent && state.hasCustomer) {
          emit(state.copyWith(isRefreshing: false));
          return;
        }

        emit(
          state.copyWith(
            status: state.hasCustomer
                ? CustomerProfileStatus.ready
                : CustomerProfileStatus.error,
            isRefreshing: false,
            errorMessage: failure.message,
          ),
        );
      },
      (_) {
        emit(
          state.copyWith(
            status: CustomerProfileStatus.ready,
            isRefreshing: false,
            clearError: true,
            lastRefreshedAt: DateTime.now(),
          ),
        );
      },
    );

    _isRefreshingInFlight = false;
  }

  void _onCustomerStreamUpdated(
    CustomerProfileCustomerStreamUpdated event,
    Emitter<CustomerProfileState> emit,
  ) {
    final customer = event.customer;
    if (customer == null) {
      if (!state.hasCustomer) {
        emit(state.copyWith(status: CustomerProfileStatus.loading));
      }
      return;
    }

    emit(
      state.copyWith(status: CustomerProfileStatus.ready, customer: customer),
    );
  }

  void _onConnectionChanged(
    CustomerProfileConnectionChanged event,
    Emitter<CustomerProfileState> emit,
  ) {
    if (event.isOnline && !_wasOnline && state.hasShop) {
      add(const CustomerProfileRefreshRequested(silent: true));
    }

    _wasOnline = event.isOnline;
  }

  void _onErrorDismissed(
    CustomerProfileErrorDismissed event,
    Emitter<CustomerProfileState> emit,
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
          add(CustomerProfileConnectionChanged(isOnline: status.isOnline)),
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
    await _customerSubscription?.cancel();
    await _connectionSubscription?.cancel();
    return super.close();
  }
}
