import 'package:app_core/app_core.dart';
import 'package:equatable/equatable.dart';

import '../entities/app_announcement.dart';
import '../repositories/announcements_repository.dart';

class FetchPublicAnnouncementsUseCase
    implements UseCase<List<AppAnnouncement>, FetchPublicAnnouncementsParams> {
  const FetchPublicAnnouncementsUseCase(this._repository);

  final AnnouncementsRepository _repository;

  @override
  Future<Result<List<AppAnnouncement>>> call(
    FetchPublicAnnouncementsParams params,
  ) {
    return _repository.fetchPublicAnnouncements(audience: params.audience);
  }
}

class FetchPublicAnnouncementsParams extends Equatable {
  const FetchPublicAnnouncementsParams({required this.audience});

  final String audience;

  @override
  List<Object?> get props => <Object?>[audience];
}
