import "package:app_core/app_core.dart";
import "package:fom_mobile/features/notifications/domain/entities/inbox_notification.dart";
import "package:fom_mobile/features/notifications/domain/entities/notification_preference.dart";
import "package:fom_mobile/features/notifications/domain/entities/notification_preference_update.dart";

abstract class NotificationsRepository {
  Future<Result<List<InboxNotification>>> fetchNotifications({
    required String shopId,
  });

  Future<Result<InboxNotification>> markNotificationRead({
    required String notificationId,
  });

  Future<Result<int>> markAllNotificationsRead({String? shopId});

  Future<Result<List<NotificationPreference>>> fetchPreferences();

  Future<Result<List<NotificationPreference>>> updatePreferences({
    required List<NotificationPreferenceUpdate> updates,
  });
}
