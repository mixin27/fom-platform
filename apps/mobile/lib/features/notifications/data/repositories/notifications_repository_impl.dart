import "package:app_core/app_core.dart";
import "package:app_logger/app_logger.dart";
import "package:fom_mobile/features/notifications/data/datasources/notifications_remote_data_source.dart";
import "package:fom_mobile/features/notifications/domain/entities/inbox_notification.dart";
import "package:fom_mobile/features/notifications/domain/entities/notification_preference.dart";
import "package:fom_mobile/features/notifications/domain/entities/notification_preference_update.dart";
import "package:fom_mobile/features/notifications/domain/repositories/notifications_repository.dart";

class NotificationsRepositoryImpl
    with LoggerMixin
    implements NotificationsRepository {
  NotificationsRepositoryImpl(this._remoteDataSource, {AppLogger? logger})
    : _logger = logger ?? AppLogger(enabled: false);

  final NotificationsRemoteDataSource _remoteDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext("NotificationsRepository");

  @override
  Future<Result<List<InboxNotification>>> fetchNotifications({
    required String shopId,
  }) async {
    try {
      final notifications = await _remoteDataSource.fetchNotifications(
        shopId: shopId,
      );
      return Result<List<InboxNotification>>.success(notifications);
    } catch (error, stackTrace) {
      log.error(
        "Failed to fetch notifications",
        error: error,
        stackTrace: stackTrace,
      );
      return Result<List<InboxNotification>>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<InboxNotification>> markNotificationRead({
    required String notificationId,
  }) async {
    try {
      final notification = await _remoteDataSource.markNotificationRead(
        notificationId: notificationId,
      );
      return Result<InboxNotification>.success(notification);
    } catch (error, stackTrace) {
      log.error(
        "Failed to mark notification read",
        error: error,
        stackTrace: stackTrace,
      );
      return Result<InboxNotification>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<int>> markAllNotificationsRead({String? shopId}) async {
    try {
      final readCount = await _remoteDataSource.markAllNotificationsRead(
        shopId: shopId,
      );
      return Result<int>.success(readCount);
    } catch (error, stackTrace) {
      log.error(
        "Failed to mark all notifications read",
        error: error,
        stackTrace: stackTrace,
      );
      return Result<int>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<List<NotificationPreference>>> fetchPreferences() async {
    try {
      final preferences = await _remoteDataSource.fetchPreferences();
      return Result<List<NotificationPreference>>.success(preferences);
    } catch (error, stackTrace) {
      log.error(
        "Failed to fetch notification preferences",
        error: error,
        stackTrace: stackTrace,
      );
      return Result<List<NotificationPreference>>.failure(
        FailureMapper.from(error),
      );
    }
  }

  @override
  Future<Result<List<NotificationPreference>>> updatePreferences({
    required List<NotificationPreferenceUpdate> updates,
  }) async {
    try {
      final preferences = await _remoteDataSource.updatePreferences(
        updates: updates,
      );
      return Result<List<NotificationPreference>>.success(preferences);
    } catch (error, stackTrace) {
      log.error(
        "Failed to update notification preferences",
        error: error,
        stackTrace: stackTrace,
      );
      return Result<List<NotificationPreference>>.failure(
        FailureMapper.from(error),
      );
    }
  }
}
