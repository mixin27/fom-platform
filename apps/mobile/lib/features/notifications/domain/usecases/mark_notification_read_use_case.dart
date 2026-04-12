import "package:app_core/app_core.dart";
import "package:fom_mobile/features/notifications/domain/entities/inbox_notification.dart";
import "package:fom_mobile/features/notifications/domain/repositories/notifications_repository.dart";

class MarkNotificationReadUseCase
    implements UseCase<InboxNotification, MarkNotificationReadParams> {
  const MarkNotificationReadUseCase(this._repository);

  final NotificationsRepository _repository;

  @override
  Future<Result<InboxNotification>> call(MarkNotificationReadParams params) {
    return _repository.markNotificationRead(
      notificationId: params.notificationId,
    );
  }
}

class MarkNotificationReadParams {
  const MarkNotificationReadParams({required this.notificationId});

  final String notificationId;
}
