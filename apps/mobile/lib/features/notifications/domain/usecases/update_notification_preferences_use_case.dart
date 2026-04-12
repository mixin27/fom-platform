import "package:app_core/app_core.dart";
import "package:fom_mobile/features/notifications/domain/entities/notification_preference.dart";
import "package:fom_mobile/features/notifications/domain/entities/notification_preference_update.dart";
import "package:fom_mobile/features/notifications/domain/repositories/notifications_repository.dart";

class UpdateNotificationPreferencesUseCase
    implements
        UseCase<
          List<NotificationPreference>,
          UpdateNotificationPreferencesParams
        > {
  const UpdateNotificationPreferencesUseCase(this._repository);

  final NotificationsRepository _repository;

  @override
  Future<Result<List<NotificationPreference>>> call(
    UpdateNotificationPreferencesParams params,
  ) {
    return _repository.updatePreferences(updates: params.updates);
  }
}

class UpdateNotificationPreferencesParams {
  const UpdateNotificationPreferencesParams({required this.updates});

  final List<NotificationPreferenceUpdate> updates;
}
