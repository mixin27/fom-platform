import "package:app_core/app_core.dart";
import "package:fom_mobile/features/notifications/domain/entities/inbox_notification.dart";
import "package:fom_mobile/features/notifications/domain/repositories/notifications_repository.dart";

class FetchNotificationsUseCase
    implements UseCase<List<InboxNotification>, FetchNotificationsParams> {
  const FetchNotificationsUseCase(this._repository);

  final NotificationsRepository _repository;

  @override
  Future<Result<List<InboxNotification>>> call(
    FetchNotificationsParams params,
  ) {
    return _repository.fetchNotifications(shopId: params.shopId);
  }
}

class FetchNotificationsParams {
  const FetchNotificationsParams({required this.shopId});

  final String shopId;
}
