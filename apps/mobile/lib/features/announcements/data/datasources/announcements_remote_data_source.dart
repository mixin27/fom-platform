import 'package:app_network/app_network.dart';

import '../models/app_announcement_model.dart';

abstract class AnnouncementsRemoteDataSource {
  Future<List<AppAnnouncementModel>> fetchPublicAnnouncements({
    required String audience,
  });

  Future<List<AppAnnouncementModel>> fetchShopAnnouncements({
    required String shopId,
  });
}

class AnnouncementsRemoteDataSourceImpl
    implements AnnouncementsRemoteDataSource {
  AnnouncementsRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<List<AppAnnouncementModel>> fetchPublicAnnouncements({
    required String audience,
  }) async {
    final payload = await _apiClient.getMap(
      '/public/announcements',
      queryParameters: <String, dynamic>{'audience': audience},
      skipAuth: true,
    );
    return _extractAnnouncements(payload);
  }

  @override
  Future<List<AppAnnouncementModel>> fetchShopAnnouncements({
    required String shopId,
  }) async {
    final payload = await _apiClient.getMap('/shops/$shopId/announcements');
    return _extractAnnouncements(payload);
  }

  List<AppAnnouncementModel> _extractAnnouncements(
    Map<String, dynamic> payload,
  ) {
    final rawAnnouncements = payload['announcements'];
    if (rawAnnouncements is! List) {
      return const <AppAnnouncementModel>[];
    }

    return rawAnnouncements
        .whereType<Map>()
        .map(
          (item) =>
              AppAnnouncementModel.fromJson(Map<String, dynamic>.from(item)),
        )
        .where((item) => item.id.isNotEmpty && item.title.isNotEmpty)
        .toList(growable: false);
  }
}
