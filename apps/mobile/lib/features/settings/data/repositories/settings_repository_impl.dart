import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';

import '../../domain/entities/settings_account_draft.dart';
import '../../domain/entities/settings_shop_profile_draft.dart';
import '../../domain/entities/settings_snapshot.dart';
import '../../domain/repositories/settings_repository.dart';
import '../datasources/settings_remote_data_source.dart';
import '../models/settings_snapshot_model.dart';

class SettingsRepositoryImpl with LoggerMixin implements SettingsRepository {
  SettingsRepositoryImpl(this._remoteDataSource, {AppLogger? logger})
    : _logger = logger ?? AppLogger(enabled: false);

  final SettingsRemoteDataSource _remoteDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('SettingsRepository');

  @override
  Future<Result<SettingsSnapshot>> fetchSettingsSnapshot({
    required String shopId,
  }) async {
    try {
      final account = await _remoteDataSource.fetchCurrentAccount();
      final shop = await _remoteDataSource.fetchShopProfile(shopId: shopId);
      final billing = await _remoteDataSource.fetchBillingOverview(
        shopId: shopId,
      );

      return Result<SettingsSnapshot>.success(
        SettingsSnapshotModel.create(
          account: account,
          shop: shop,
          billing: billing,
        ),
      );
    } catch (error, stackTrace) {
      log.error(
        'Failed to fetch settings snapshot',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<SettingsSnapshot>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<SettingsSnapshot>> updateAccountProfile({
    required String shopId,
    required SettingsAccountDraft draft,
  }) async {
    try {
      await _remoteDataSource.updateCurrentAccount(draft: draft);
      return fetchSettingsSnapshot(shopId: shopId);
    } catch (error, stackTrace) {
      log.error(
        'Failed to update account profile',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<SettingsSnapshot>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<SettingsSnapshot>> updateShopProfile({
    required String shopId,
    required SettingsShopProfileDraft draft,
  }) async {
    try {
      await _remoteDataSource.updateShopProfile(shopId: shopId, draft: draft);
      return fetchSettingsSnapshot(shopId: shopId);
    } catch (error, stackTrace) {
      log.error(
        'Failed to update shop profile',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<SettingsSnapshot>.failure(FailureMapper.from(error));
    }
  }
}
