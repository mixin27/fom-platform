import "dart:async";

import "package:app_logger/app_logger.dart";
import "package:app_network/app_network.dart";
import "package:app_realtime/app_realtime.dart";
import "package:flutter_bloc/flutter_bloc.dart";

import "../../domain/entities/report_period.dart";
import "../../domain/entities/shop_report_snapshot.dart";
import "../../domain/usecases/refresh_report_use_case.dart";
import "../../domain/usecases/watch_report_use_case.dart";
import "reports_home_event.dart";
import "reports_home_state.dart";

class ReportsHomeBloc extends Bloc<ReportsHomeEvent, ReportsHomeState>
    with LoggerMixin {
  ReportsHomeBloc({
    required WatchReportUseCase watchReportUseCase,
    required RefreshReportUseCase refreshReportUseCase,
    required NetworkConnectionService networkConnectionService,
    required AppRealtimeService realtimeService,
    AppLogger? logger,
  }) : _watchReportUseCase = watchReportUseCase,
       _refreshReportUseCase = refreshReportUseCase,
       _networkConnectionService = networkConnectionService,
       _realtimeService = realtimeService,
       _logger = logger ?? AppLogger(enabled: false),
       super(const ReportsHomeState()) {
    on<ReportsHomeStarted>(_onStarted);
    on<ReportsHomeRefreshRequested>(_onRefreshRequested);
    on<ReportsHomePeriodChanged>(_onPeriodChanged);
    on<ReportsHomePreviousRequested>(_onPreviousRequested);
    on<ReportsHomeNextRequested>(_onNextRequested);
    on<ReportsHomeReportStreamUpdated>(_onReportStreamUpdated);
    on<ReportsHomeConnectionChanged>(_onConnectionChanged);
    on<ReportsHomeErrorDismissed>(_onErrorDismissed);
  }

  static const Duration _backgroundRefreshInterval = Duration(minutes: 3);

  final WatchReportUseCase _watchReportUseCase;
  final RefreshReportUseCase _refreshReportUseCase;
  final NetworkConnectionService _networkConnectionService;
  final AppRealtimeService _realtimeService;
  final AppLogger _logger;

  StreamSubscription<ShopReportSnapshot?>? _reportSubscription;
  StreamSubscription<NetworkConnectionStatus>? _connectionSubscription;
  StreamSubscription<RealtimeEvent>? _realtimeSubscription;
  Timer? _backgroundRefreshTimer;
  bool _isRefreshingInFlight = false;
  bool _wasOnline = false;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext("ReportsHomeBloc");

  Future<void> _onStarted(
    ReportsHomeStarted event,
    Emitter<ReportsHomeState> emit,
  ) async {
    final normalizedShopId = event.shopId.trim();
    final normalizedShopName = event.shopName.trim().isEmpty
        ? "My Shop"
        : event.shopName.trim();

    if (normalizedShopId.isEmpty) {
      emit(
        state.copyWith(
          status: ReportsHomeStatus.error,
          shopId: "",
          shopName: normalizedShopName,
          errorMessage: "Shop access is not available for this account.",
        ),
      );
      return;
    }

    log.info("Starting reports home for shop=$normalizedShopId");

    final initialPeriod = state.selectedPeriod;
    final initialAnchor = normalizeReportAnchorDate(
      initialPeriod,
      DateTime.now(),
    );

    emit(
      state.copyWith(
        status: ReportsHomeStatus.loading,
        shopId: normalizedShopId,
        shopName: normalizedShopName,
        selectedPeriod: initialPeriod,
        anchorDate: initialAnchor,
        clearReport: true,
        clearError: true,
      ),
    );

    await _restartReportStream(
      shopId: normalizedShopId,
      period: initialPeriod,
      anchorDate: initialAnchor,
    );

    _startConnectivitySubscription();
    _startRealtimeSubscription();
    _startBackgroundRefreshTimer();
    add(const ReportsHomeRefreshRequested());
  }

  Future<void> _onRefreshRequested(
    ReportsHomeRefreshRequested event,
    Emitter<ReportsHomeState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    if (shopId == null || shopId.isEmpty || _isRefreshingInFlight) {
      return;
    }

    if (event.silent && !_networkConnectionService.currentStatus.isOnline) {
      return;
    }

    if (!event.silent) {
      log.info(
        "Refreshing ${state.selectedPeriod.apiValue} report for shop=$shopId",
      );
    }

    _isRefreshingInFlight = true;

    if (!event.silent) {
      emit(
        state.copyWith(
          status: state.hasReport
              ? ReportsHomeStatus.ready
              : ReportsHomeStatus.loading,
          isRefreshing: true,
          clearError: true,
        ),
      );
    }

    final result = await _refreshReportUseCase(
      RefreshReportParams(
        shopId: shopId,
        period: state.selectedPeriod,
        anchorDate: state.resolvedAnchorDate,
      ),
    );

    if (isClosed) {
      _isRefreshingInFlight = false;
      return;
    }

    result.fold(
      (failure) {
        if (event.silent && state.hasReport) {
          emit(state.copyWith(isRefreshing: false));
          return;
        }

        emit(
          state.copyWith(
            status: state.hasReport
                ? ReportsHomeStatus.ready
                : ReportsHomeStatus.error,
            isRefreshing: false,
            errorMessage: failure.message,
          ),
        );
      },
      (_) {
        log.info(
          "Report refreshed: period=${state.selectedPeriod.apiValue}, key=${state.activePeriodKey}",
        );
        emit(
          state.copyWith(
            status: state.hasReport
                ? ReportsHomeStatus.ready
                : ReportsHomeStatus.loading,
            isRefreshing: false,
            clearError: true,
            lastRefreshedAt: DateTime.now(),
          ),
        );
      },
    );

    _isRefreshingInFlight = false;
  }

  Future<void> _onPeriodChanged(
    ReportsHomePeriodChanged event,
    Emitter<ReportsHomeState> emit,
  ) async {
    if (!state.hasShop || event.period == state.selectedPeriod) {
      return;
    }

    log.info(
      "Switching report period: ${state.selectedPeriod.apiValue} -> ${event.period.apiValue}",
    );

    final shopId = state.shopId!;
    final nextAnchor = _clampAnchorDate(
      period: event.period,
      value: state.resolvedAnchorDate,
    );

    emit(
      state.copyWith(
        status: ReportsHomeStatus.loading,
        selectedPeriod: event.period,
        anchorDate: nextAnchor,
        clearReport: true,
        clearError: true,
      ),
    );

    await _restartReportStream(
      shopId: shopId,
      period: event.period,
      anchorDate: nextAnchor,
    );

    add(const ReportsHomeRefreshRequested());
  }

  Future<void> _onPreviousRequested(
    ReportsHomePreviousRequested event,
    Emitter<ReportsHomeState> emit,
  ) async {
    if (!state.hasShop) {
      return;
    }

    log.info("Navigating to previous ${state.selectedPeriod.apiValue} report");

    final shopId = state.shopId!;
    final shifted = shiftReportAnchorDate(
      period: state.selectedPeriod,
      anchorDate: state.resolvedAnchorDate,
      step: -1,
    );
    final nextAnchor = _clampAnchorDate(
      period: state.selectedPeriod,
      value: shifted,
    );

    emit(
      state.copyWith(
        status: ReportsHomeStatus.loading,
        anchorDate: nextAnchor,
        clearReport: true,
        clearError: true,
      ),
    );

    await _restartReportStream(
      shopId: shopId,
      period: state.selectedPeriod,
      anchorDate: nextAnchor,
    );

    add(const ReportsHomeRefreshRequested());
  }

  Future<void> _onNextRequested(
    ReportsHomeNextRequested event,
    Emitter<ReportsHomeState> emit,
  ) async {
    if (!state.hasShop || !state.canNavigateNext) {
      return;
    }

    log.info("Navigating to next ${state.selectedPeriod.apiValue} report");

    final shopId = state.shopId!;
    final shifted = shiftReportAnchorDate(
      period: state.selectedPeriod,
      anchorDate: state.resolvedAnchorDate,
      step: 1,
    );
    final nextAnchor = _clampAnchorDate(
      period: state.selectedPeriod,
      value: shifted,
    );

    if (_isSamePeriodAnchor(
      state.selectedPeriod,
      nextAnchor,
      state.resolvedAnchorDate,
    )) {
      return;
    }

    emit(
      state.copyWith(
        status: ReportsHomeStatus.loading,
        anchorDate: nextAnchor,
        clearReport: true,
        clearError: true,
      ),
    );

    await _restartReportStream(
      shopId: shopId,
      period: state.selectedPeriod,
      anchorDate: nextAnchor,
    );

    add(const ReportsHomeRefreshRequested());
  }

  void _onReportStreamUpdated(
    ReportsHomeReportStreamUpdated event,
    Emitter<ReportsHomeState> emit,
  ) {
    final report = event.report;
    if (report == null) {
      if (!state.hasReport) {
        emit(state.copyWith(status: ReportsHomeStatus.loading));
      }
      return;
    }

    log.debug(
      "Report stream update: period=${report.period.apiValue}, key=${report.periodKey}",
    );

    emit(
      state.copyWith(
        status: ReportsHomeStatus.ready,
        report: report,
        clearError: true,
      ),
    );
  }

  void _onConnectionChanged(
    ReportsHomeConnectionChanged event,
    Emitter<ReportsHomeState> emit,
  ) {
    if (event.isOnline && !_wasOnline && state.hasShop) {
      log.info("Network restored. Triggering silent reports refresh.");
      add(const ReportsHomeRefreshRequested(silent: true));
    }

    _wasOnline = event.isOnline;
  }

  void _onErrorDismissed(
    ReportsHomeErrorDismissed event,
    Emitter<ReportsHomeState> emit,
  ) {
    emit(state.copyWith(clearError: true));
  }

  Future<void> _restartReportStream({
    required String shopId,
    required ReportPeriod period,
    required DateTime anchorDate,
  }) async {
    await _reportSubscription?.cancel();

    final periodKey = buildReportPeriodKey(
      period: period,
      anchorDate: anchorDate,
    );

    _reportSubscription =
        _watchReportUseCase(
          shopId: shopId,
          period: period,
          periodKey: periodKey,
        ).listen(
          (report) => add(ReportsHomeReportStreamUpdated(report)),
          onError: (Object error, StackTrace stackTrace) {
            log.error(
              "Report stream error",
              error: error,
              stackTrace: stackTrace,
            );
          },
        );
  }

  void _startConnectivitySubscription() {
    if (_connectionSubscription != null) {
      return;
    }

    _wasOnline = _networkConnectionService.currentStatus.isOnline;
    _connectionSubscription = _networkConnectionService.statusStream.listen(
      (status) => add(ReportsHomeConnectionChanged(isOnline: status.isOnline)),
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

      add(const ReportsHomeRefreshRequested(silent: true));
    });
  }

  void _startRealtimeSubscription() {
    if (_realtimeSubscription != null) {
      return;
    }

    _realtimeSubscription = _realtimeService.events.listen((event) {
      final shopId = state.shopId?.trim();
      if (shopId == null || shopId.isEmpty || !event.matchesShop(shopId)) {
        return;
      }

      if (
        event.invalidatesAny(
          const <String>{'orders', 'deliveries', 'customers'},
        )
      ) {
        log.debug(
          'Realtime invalidation received for reports: ${event.resource}/${event.action}',
        );
        add(const ReportsHomeRefreshRequested(silent: true));
      }
    });
  }

  DateTime _clampAnchorDate({
    required ReportPeriod period,
    required DateTime value,
  }) {
    final now = normalizeReportAnchorDate(period, DateTime.now());
    final normalized = normalizeReportAnchorDate(period, value);

    switch (period) {
      case ReportPeriod.daily:
        if (normalized.isAfter(now)) {
          return now;
        }
        return normalized;
      case ReportPeriod.weekly:
        final targetWeekStart = startOfReportWeek(normalized);
        final currentWeekStart = startOfReportWeek(now);
        if (targetWeekStart.isAfter(currentWeekStart)) {
          return now;
        }
        return normalized;
      case ReportPeriod.monthly:
        final targetMonth = DateTime(normalized.year, normalized.month);
        final currentMonth = DateTime(now.year, now.month);
        if (targetMonth.isAfter(currentMonth)) {
          return currentMonth;
        }
        return targetMonth;
    }
  }

  bool _isSamePeriodAnchor(ReportPeriod period, DateTime left, DateTime right) {
    switch (period) {
      case ReportPeriod.daily:
        return left.year == right.year &&
            left.month == right.month &&
            left.day == right.day;
      case ReportPeriod.weekly:
        final leftWeek = startOfReportWeek(left);
        final rightWeek = startOfReportWeek(right);
        return leftWeek.year == rightWeek.year &&
            leftWeek.month == rightWeek.month &&
            leftWeek.day == rightWeek.day;
      case ReportPeriod.monthly:
        return left.year == right.year && left.month == right.month;
    }
  }

  @override
  Future<void> close() async {
    _backgroundRefreshTimer?.cancel();
    await _reportSubscription?.cancel();
    await _connectionSubscription?.cancel();
    await _realtimeSubscription?.cancel();
    return super.close();
  }
}
