import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';

import '../../domain/entities/app_announcement.dart';
import '../../domain/repositories/announcements_repository.dart';
import '../datasources/announcements_local_data_source.dart';
import '../datasources/announcements_remote_data_source.dart';

class AnnouncementsRepositoryImpl
    with LoggerMixin
    implements AnnouncementsRepository {
  AnnouncementsRepositoryImpl(
    this._remoteDataSource,
    this._localDataSource, {
    AppLogger? logger,
  }) : _logger = logger ?? AppLogger(enabled: false);

  final AnnouncementsRemoteDataSource _remoteDataSource;
  final AnnouncementsLocalDataSource _localDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('AnnouncementsRepository');

  @override
  Future<Result<List<AppAnnouncement>>> fetchPublicAnnouncements({
    required String audience,
  }) async {
    final scope = 'public:${audience.trim().toLowerCase()}';

    try {
      final announcements = await _remoteDataSource.fetchPublicAnnouncements(
        audience: audience,
      );
      final dismissedIds = await _localDataSource.readDismissedIds(
        scope: scope,
      );

      return Result<List<AppAnnouncement>>.success(
        announcements
            .where((announcement) => !dismissedIds.contains(announcement.id))
            .toList(growable: false),
      );
    } catch (error, stackTrace) {
      log.warning('Failed to fetch public announcements: $error');
      log.error(
        'Public announcements error details',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<List<AppAnnouncement>>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<List<AppAnnouncement>>> fetchShopAnnouncements({
    required String shopId,
  }) async {
    final scope = 'shop:${shopId.trim()}';

    try {
      final announcements = await _remoteDataSource.fetchShopAnnouncements(
        shopId: shopId,
      );
      final dismissedIds = await _localDataSource.readDismissedIds(
        scope: scope,
      );

      return Result<List<AppAnnouncement>>.success(
        announcements
            .where((announcement) => !dismissedIds.contains(announcement.id))
            .toList(growable: false),
      );
    } catch (error, stackTrace) {
      log.warning('Failed to fetch shop announcements: $error');
      log.error(
        'Shop announcements error details',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<List<AppAnnouncement>>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<void> dismissAnnouncement({
    required String scope,
    required String announcementId,
  }) {
    return _localDataSource.dismissAnnouncement(
      scope: scope,
      announcementId: announcementId,
    );
  }
}
