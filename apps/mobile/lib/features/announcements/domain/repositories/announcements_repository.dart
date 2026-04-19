import 'package:app_core/app_core.dart';

import '../entities/app_announcement.dart';

abstract class AnnouncementsRepository {
  Future<Result<List<AppAnnouncement>>> fetchPublicAnnouncements({
    required String audience,
  });

  Future<Result<List<AppAnnouncement>>> fetchShopAnnouncements({
    required String shopId,
  });

  Future<void> dismissAnnouncement({
    required String scope,
    required String announcementId,
  });
}
