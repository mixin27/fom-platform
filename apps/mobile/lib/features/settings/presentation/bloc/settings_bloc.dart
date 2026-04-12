import 'package:app_logger/app_logger.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/fetch_settings_snapshot_use_case.dart';
import 'settings_event.dart';
import 'settings_state.dart';

class SettingsBloc extends Bloc<SettingsEvent, SettingsState> with LoggerMixin {
  SettingsBloc({
    required FetchSettingsSnapshotUseCase fetchSettingsSnapshotUseCase,
    AppLogger? logger,
  }) : _fetchSettingsSnapshotUseCase = fetchSettingsSnapshotUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const SettingsState()) {
    on<SettingsStarted>(_onStarted);
    on<SettingsErrorDismissed>(_onErrorDismissed);
  }

  final FetchSettingsSnapshotUseCase _fetchSettingsSnapshotUseCase;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('SettingsBloc');

  Future<void> _onStarted(
    SettingsStarted event,
    Emitter<SettingsState> emit,
  ) async {
    final shopId = event.shopId.trim();
    if (shopId.isEmpty) {
      emit(
        state.copyWith(
          status: SettingsStatus.error,
          errorMessage: 'Select a shop before opening settings.',
          removeSnapshot: true,
        ),
      );
      return;
    }

    if (!event.forceRefresh &&
        state.status == SettingsStatus.ready &&
        state.shopId == shopId &&
        state.hasSnapshot) {
      return;
    }

    emit(
      state.copyWith(
        status: state.hasSnapshot && state.shopId == shopId
            ? SettingsStatus.ready
            : SettingsStatus.loading,
        shopId: shopId,
        clearError: true,
      ),
    );

    final result = await _fetchSettingsSnapshotUseCase(
      FetchSettingsSnapshotParams(shopId: shopId),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: state.hasSnapshot && state.shopId == shopId
                ? SettingsStatus.ready
                : SettingsStatus.error,
            errorMessage: failure.message,
          ),
        );
      },
      (snapshot) {
        emit(
          state.copyWith(
            status: SettingsStatus.ready,
            shopId: shopId,
            snapshot: snapshot,
            clearError: true,
          ),
        );
      },
    );
  }

  void _onErrorDismissed(
    SettingsErrorDismissed event,
    Emitter<SettingsState> emit,
  ) {
    emit(state.copyWith(clearError: true));
  }
}
