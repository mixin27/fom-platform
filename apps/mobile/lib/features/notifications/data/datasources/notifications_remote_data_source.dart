import "package:app_network/app_network.dart";
import "package:fom_mobile/features/notifications/data/models/inbox_notification_model.dart";
import "package:fom_mobile/features/notifications/data/models/notification_preference_model.dart";
import "package:fom_mobile/features/notifications/domain/entities/notification_preference_update.dart";

abstract class NotificationsRemoteDataSource {
  Future<List<InboxNotificationModel>> fetchNotifications({
    required String shopId,
    int limit,
  });

  Future<InboxNotificationModel> markNotificationRead({
    required String notificationId,
  });

  Future<int> markAllNotificationsRead({String? shopId});

  Future<List<NotificationPreferenceModel>> fetchPreferences();

  Future<List<NotificationPreferenceModel>> updatePreferences({
    required List<NotificationPreferenceUpdate> updates,
  });
}

class NotificationsRemoteDataSourceImpl
    implements NotificationsRemoteDataSource {
  NotificationsRemoteDataSourceImpl(this._apiClient);

  static const int _defaultListLimit = 100;

  final ApiClient _apiClient;

  @override
  Future<List<InboxNotificationModel>> fetchNotifications({
    required String shopId,
    int limit = _defaultListLimit,
  }) async {
    final payload = await _apiClient.getList(
      "/users/me/notifications",
      queryParameters: <String, dynamic>{"shop_id": shopId, "limit": limit},
    );

    return payload
        .map(InboxNotificationModel.fromJson)
        .where((notification) => notification.id.isNotEmpty)
        .toList(growable: false);
  }

  @override
  Future<InboxNotificationModel> markNotificationRead({
    required String notificationId,
  }) async {
    final payload = await _apiClient.patchMap(
      "/users/me/notifications/$notificationId/read",
    );
    return InboxNotificationModel.fromJson(payload);
  }

  @override
  Future<int> markAllNotificationsRead({String? shopId}) async {
    final payload = await _apiClient.postMap(
      "/users/me/notifications/read-all",
      data: <String, dynamic>{
        if ((shopId ?? "").trim().isNotEmpty) "shop_id": shopId!.trim(),
      },
    );

    final rawCount = payload["read_count"];
    if (rawCount is int) {
      return rawCount;
    }

    if (rawCount is num) {
      return rawCount.toInt();
    }

    return 0;
  }

  @override
  Future<List<NotificationPreferenceModel>> fetchPreferences() async {
    final payload = await _apiClient.getMap("/users/me/notification-preferences");
    return _extractPreferences(payload);
  }

  @override
  Future<List<NotificationPreferenceModel>> updatePreferences({
    required List<NotificationPreferenceUpdate> updates,
  }) async {
    final payload = await _apiClient.patchMap(
      "/users/me/notification-preferences",
      data: <String, dynamic>{
        "preferences": updates
            .map(
              (update) => <String, dynamic>{
                "category": update.category,
                if (update.inAppEnabled != null)
                  "in_app_enabled": update.inAppEnabled,
                if (update.emailEnabled != null)
                  "email_enabled": update.emailEnabled,
              },
            )
            .toList(growable: false),
      },
    );

    return _extractPreferences(payload);
  }

  List<NotificationPreferenceModel> _extractPreferences(
    Map<String, dynamic> payload,
  ) {
    final preferences = payload["preferences"];
    if (preferences is! List) {
      return const <NotificationPreferenceModel>[];
    }

    return preferences
        .whereType<Map>()
        .map((item) => NotificationPreferenceModel.fromJson(item))
        .where((preference) => preference.category.isNotEmpty)
        .toList(growable: false);
  }
}
