import '../repositories/announcements_repository.dart';

class DismissAnnouncementUseCase {
  const DismissAnnouncementUseCase(this._repository);

  final AnnouncementsRepository _repository;

  Future<void> call({required String scope, required String announcementId}) {
    return _repository.dismissAnnouncement(
      scope: scope,
      announcementId: announcementId,
    );
  }
}
