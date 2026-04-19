import 'package:app_core/app_core.dart';
import 'package:equatable/equatable.dart';

import '../entities/app_announcement.dart';
import '../repositories/announcements_repository.dart';

class FetchShopAnnouncementsUseCase
    implements UseCase<List<AppAnnouncement>, FetchShopAnnouncementsParams> {
  const FetchShopAnnouncementsUseCase(this._repository);

  final AnnouncementsRepository _repository;

  @override
  Future<Result<List<AppAnnouncement>>> call(
    FetchShopAnnouncementsParams params,
  ) {
    return _repository.fetchShopAnnouncements(shopId: params.shopId);
  }
}

class FetchShopAnnouncementsParams extends Equatable {
  const FetchShopAnnouncementsParams({required this.shopId});

  final String shopId;

  @override
  List<Object?> get props => <Object?>[shopId];
}
