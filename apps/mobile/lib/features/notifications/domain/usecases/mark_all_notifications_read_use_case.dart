import "package:app_core/app_core.dart";
import "package:fom_mobile/features/notifications/domain/repositories/notifications_repository.dart";

class MarkAllNotificationsReadUseCase
    implements UseCase<int, MarkAllNotificationsReadParams> {
  const MarkAllNotificationsReadUseCase(this._repository);

  final NotificationsRepository _repository;

  @override
  Future<Result<int>> call(MarkAllNotificationsReadParams params) {
    return _repository.markAllNotificationsRead(shopId: params.shopId);
  }
}

class MarkAllNotificationsReadParams {
  const MarkAllNotificationsReadParams({this.shopId});

  final String? shopId;
}
