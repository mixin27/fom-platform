import "package:app_logger/app_logger.dart";
import "package:flutter_bloc/flutter_bloc.dart";
import "package:fom_mobile/features/notifications/domain/entities/inbox_notification.dart";
import "package:fom_mobile/features/notifications/domain/usecases/fetch_notifications_use_case.dart";
import "package:fom_mobile/features/notifications/domain/usecases/mark_all_notifications_read_use_case.dart";
import "package:fom_mobile/features/notifications/domain/usecases/mark_notification_read_use_case.dart";
import "package:fom_mobile/features/notifications/presentation/bloc/notifications_home_event.dart";
import "package:fom_mobile/features/notifications/presentation/bloc/notifications_home_state.dart";

class NotificationsHomeBloc
    extends Bloc<NotificationsHomeEvent, NotificationsHomeState>
    with LoggerMixin {
  NotificationsHomeBloc({
    required FetchNotificationsUseCase fetchNotificationsUseCase,
    required MarkNotificationReadUseCase markNotificationReadUseCase,
    required MarkAllNotificationsReadUseCase markAllNotificationsReadUseCase,
    AppLogger? logger,
  }) : _fetchNotificationsUseCase = fetchNotificationsUseCase,
       _markNotificationReadUseCase = markNotificationReadUseCase,
       _markAllNotificationsReadUseCase = markAllNotificationsReadUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const NotificationsHomeState()) {
    on<NotificationsHomeStarted>(_onStarted);
    on<NotificationsHomeRefreshRequested>(_onRefreshRequested);
    on<NotificationsHomeNotificationReadRequested>(_onReadRequested);
    on<NotificationsHomeMarkAllRequested>(_onMarkAllRequested);
    on<NotificationsHomeErrorDismissed>(_onErrorDismissed);
  }

  final FetchNotificationsUseCase _fetchNotificationsUseCase;
  final MarkNotificationReadUseCase _markNotificationReadUseCase;
  final MarkAllNotificationsReadUseCase _markAllNotificationsReadUseCase;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext("NotificationsHomeBloc");

  Future<void> _onStarted(
    NotificationsHomeStarted event,
    Emitter<NotificationsHomeState> emit,
  ) async {
    final normalizedShopId = event.shopId.trim();
    final normalizedShopName = event.shopName.trim().isEmpty
        ? "My Shop"
        : event.shopName.trim();

    if (normalizedShopId.isEmpty) {
      emit(
        state.copyWith(
          status: NotificationsHomeStatus.error,
          shopId: "",
          shopName: normalizedShopName,
          errorMessage: "Shop access is not available for this account.",
        ),
      );
      return;
    }

    emit(
      state.copyWith(
        status: NotificationsHomeStatus.loading,
        shopId: normalizedShopId,
        shopName: normalizedShopName,
        clearError: true,
      ),
    );

    add(const NotificationsHomeRefreshRequested());
  }

  Future<void> _onRefreshRequested(
    NotificationsHomeRefreshRequested event,
    Emitter<NotificationsHomeState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    if (shopId == null || shopId.isEmpty) {
      return;
    }

    emit(
      state.copyWith(
        status: state.hasNotifications
            ? NotificationsHomeStatus.ready
            : NotificationsHomeStatus.loading,
        isRefreshing: true,
        clearError: true,
      ),
    );

    final result = await _fetchNotificationsUseCase(
      FetchNotificationsParams(shopId: shopId),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: state.hasNotifications
                ? NotificationsHomeStatus.ready
                : NotificationsHomeStatus.error,
            isRefreshing: false,
            errorMessage: failure.message,
          ),
        );
      },
      (notifications) {
        emit(
          state.copyWith(
            status: NotificationsHomeStatus.ready,
            notifications: notifications,
            isRefreshing: false,
            clearError: true,
            lastRefreshedAt: DateTime.now(),
          ),
        );
      },
    );
  }

  Future<void> _onReadRequested(
    NotificationsHomeNotificationReadRequested event,
    Emitter<NotificationsHomeState> emit,
  ) async {
    final existing = state.notifications.where(
      (item) => item.id == event.notificationId,
    );
    if (existing.isEmpty || existing.first.isRead) {
      return;
    }

    final previousNotifications = state.notifications;
    emit(
      state.copyWith(
        notifications: _markNotificationAsRead(
          state.notifications,
          event.notificationId,
        ),
        updatingNotificationIds: <String>[
          ...state.updatingNotificationIds,
          event.notificationId,
        ],
        clearError: true,
      ),
    );

    final result = await _markNotificationReadUseCase(
      MarkNotificationReadParams(notificationId: event.notificationId),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            notifications: previousNotifications,
            updatingNotificationIds: _removeUpdatingId(event.notificationId),
            errorMessage: failure.message,
          ),
        );
      },
      (notification) {
        emit(
          state.copyWith(
            notifications: state.notifications
                .map((item) => item.id == notification.id ? notification : item)
                .toList(growable: false),
            updatingNotificationIds: _removeUpdatingId(event.notificationId),
            clearError: true,
          ),
        );
      },
    );
  }

  Future<void> _onMarkAllRequested(
    NotificationsHomeMarkAllRequested event,
    Emitter<NotificationsHomeState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    if (shopId == null || shopId.isEmpty || state.unreadCount == 0) {
      return;
    }

    final previousNotifications = state.notifications;
    emit(
      state.copyWith(
        notifications: state.notifications
            .map(
              (item) => item.isRead
                  ? item
                  : item.copyWith(isRead: true, readAt: DateTime.now()),
            )
            .toList(growable: false),
        isMarkingAllRead: true,
        clearError: true,
      ),
    );

    final result = await _markAllNotificationsReadUseCase(
      MarkAllNotificationsReadParams(shopId: shopId),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            notifications: previousNotifications,
            isMarkingAllRead: false,
            errorMessage: failure.message,
          ),
        );
      },
      (_) {
        emit(state.copyWith(isMarkingAllRead: false, clearError: true));
      },
    );
  }

  void _onErrorDismissed(
    NotificationsHomeErrorDismissed event,
    Emitter<NotificationsHomeState> emit,
  ) {
    emit(state.copyWith(clearError: true));
  }

  List<InboxNotification> _markNotificationAsRead(
    List<InboxNotification> notifications,
    String notificationId,
  ) {
    final readAt = DateTime.now();
    return notifications
        .map(
          (item) => item.id == notificationId
              ? item.copyWith(isRead: true, readAt: readAt)
              : item,
        )
        .toList(growable: false);
  }

  List<String> _removeUpdatingId(String notificationId) {
    return state.updatingNotificationIds
        .where((item) => item != notificationId)
        .toList(growable: false);
  }
}
