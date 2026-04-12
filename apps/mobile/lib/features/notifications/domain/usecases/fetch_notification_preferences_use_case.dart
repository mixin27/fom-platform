import "package:app_core/app_core.dart";
import "package:fom_mobile/features/notifications/domain/entities/notification_preference.dart";
import "package:fom_mobile/features/notifications/domain/repositories/notifications_repository.dart";

class FetchNotificationPreferencesUseCase
    implements UseCase<List<NotificationPreference>, NoParams> {
  const FetchNotificationPreferencesUseCase(this._repository);

  final NotificationsRepository _repository;

  @override
  Future<Result<List<NotificationPreference>>> call(NoParams params) {
    return _repository.fetchPreferences();
  }
}
