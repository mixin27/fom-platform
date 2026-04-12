import "package:app_core/app_core.dart";
import "package:app_logger/app_logger.dart";
import "package:flutter_bloc/flutter_bloc.dart";
import "package:fom_mobile/features/notifications/domain/entities/notification_preference_update.dart";
import "package:fom_mobile/features/notifications/domain/usecases/fetch_notification_preferences_use_case.dart";
import "package:fom_mobile/features/notifications/domain/usecases/update_notification_preferences_use_case.dart";
import "package:fom_mobile/features/notifications/presentation/bloc/notification_preferences_event.dart";
import "package:fom_mobile/features/notifications/presentation/bloc/notification_preferences_state.dart";

class NotificationPreferencesBloc
    extends Bloc<NotificationPreferencesEvent, NotificationPreferencesState>
    with LoggerMixin {
  NotificationPreferencesBloc({
    required FetchNotificationPreferencesUseCase
    fetchNotificationPreferencesUseCase,
    required UpdateNotificationPreferencesUseCase
    updateNotificationPreferencesUseCase,
    AppLogger? logger,
  }) : _fetchNotificationPreferencesUseCase =
           fetchNotificationPreferencesUseCase,
       _updateNotificationPreferencesUseCase =
           updateNotificationPreferencesUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const NotificationPreferencesState()) {
    on<NotificationPreferencesStarted>(_onStarted);
    on<NotificationPreferencesToggleRequested>(_onToggleRequested);
    on<NotificationPreferencesErrorDismissed>(_onErrorDismissed);
  }

  final FetchNotificationPreferencesUseCase
  _fetchNotificationPreferencesUseCase;
  final UpdateNotificationPreferencesUseCase
  _updateNotificationPreferencesUseCase;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext("NotificationPreferencesBloc");

  Future<void> _onStarted(
    NotificationPreferencesStarted event,
    Emitter<NotificationPreferencesState> emit,
  ) async {
    emit(
      state.copyWith(
        status: state.hasPreferences
            ? NotificationPreferencesStatus.ready
            : NotificationPreferencesStatus.loading,
        clearError: true,
      ),
    );

    final result = await _fetchNotificationPreferencesUseCase(const NoParams());

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: state.hasPreferences
                ? NotificationPreferencesStatus.ready
                : NotificationPreferencesStatus.error,
            errorMessage: failure.message,
          ),
        );
      },
      (preferences) {
        emit(
          state.copyWith(
            status: NotificationPreferencesStatus.ready,
            preferences: preferences,
            clearError: true,
          ),
        );
      },
    );
  }

  Future<void> _onToggleRequested(
    NotificationPreferencesToggleRequested event,
    Emitter<NotificationPreferencesState> emit,
  ) async {
    final existingPreference = state.preferenceFor(event.category);
    if (existingPreference == null ||
        state.updatingCategories.contains(event.category)) {
      return;
    }

    final previousPreferences = state.preferences;
    final optimisticPreferences = state.preferences
        .map(
          (preference) => preference.category == event.category
              ? preference.copyWith(
                  inAppEnabled: event.enabled,
                  emailEnabled: event.enabled,
                )
              : preference,
        )
        .toList(growable: false);

    emit(
      state.copyWith(
        preferences: optimisticPreferences,
        updatingCategories: <String>[
          ...state.updatingCategories,
          event.category,
        ],
        clearError: true,
      ),
    );

    final result = await _updateNotificationPreferencesUseCase(
      UpdateNotificationPreferencesParams(
        updates: <NotificationPreferenceUpdate>[
          NotificationPreferenceUpdate(
            category: event.category,
            inAppEnabled: event.enabled,
            emailEnabled: event.enabled,
          ),
        ],
      ),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            preferences: previousPreferences,
            updatingCategories: _removeUpdatingCategory(event.category),
            errorMessage: failure.message,
          ),
        );
      },
      (preferences) {
        emit(
          state.copyWith(
            status: NotificationPreferencesStatus.ready,
            preferences: preferences,
            updatingCategories: _removeUpdatingCategory(event.category),
            clearError: true,
          ),
        );
      },
    );
  }

  void _onErrorDismissed(
    NotificationPreferencesErrorDismissed event,
    Emitter<NotificationPreferencesState> emit,
  ) {
    emit(state.copyWith(clearError: true));
  }

  List<String> _removeUpdatingCategory(String category) {
    return state.updatingCategories
        .where((entry) => entry != category)
        .toList(growable: false);
  }
}
