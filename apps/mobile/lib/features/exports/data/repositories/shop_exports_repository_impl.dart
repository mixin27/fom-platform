import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';
import 'package:intl/intl.dart';

import '../../domain/entities/shop_export_file.dart';
import '../../domain/entities/shop_order_import_summary.dart';
import '../../domain/repositories/shop_exports_repository.dart';
import '../datasources/shop_exports_local_data_source.dart';
import '../datasources/shop_exports_remote_data_source.dart';

class ShopExportsRepositoryImpl
    with LoggerMixin
    implements ShopExportsRepository {
  ShopExportsRepositoryImpl(
    this._remoteDataSource,
    this._localDataSource, {
    AppLogger? logger,
  }) : _logger = logger ?? AppLogger(enabled: false);

  final ShopExportsRemoteDataSource _remoteDataSource;
  final ShopExportsLocalDataSource _localDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('ShopExportsRepository');

  @override
  Future<Result<ShopExportFile>> saveShopDataset({
    required String shopId,
    required String shopName,
    required String dataset,
    required String extension,
    required String mimeType,
  }) async {
    try {
      final bytes = await _remoteDataSource.downloadShopDataset(
        shopId: shopId,
        dataset: dataset,
        extension: extension,
      );
      final fileName = _buildFileName(
        shopName: shopName,
        dataset: dataset,
        extension: extension,
      );
      final savedFile = await _localDataSource.savePublicFile(
        bytes: bytes,
        fileName: fileName,
        allowedExtensions: <String>[extension],
      );

      log.info('Export saved: shop=$shopId, dataset=$dataset');
      return Result<ShopExportFile>.success(savedFile);
    } catch (error, stackTrace) {
      log.error('Failed to save export', error: error, stackTrace: stackTrace);
      return Result<ShopExportFile>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<void>> shareShopDataset({
    required String shopId,
    required String shopName,
    required String dataset,
    required String extension,
    required String mimeType,
    required String subject,
    String? text,
  }) async {
    try {
      final bytes = await _remoteDataSource.downloadShopDataset(
        shopId: shopId,
        dataset: dataset,
        extension: extension,
      );
      final fileName = _buildFileName(
        shopName: shopName,
        dataset: dataset,
        extension: extension,
      );
      await _localDataSource.shareFile(
        bytes: bytes,
        fileName: fileName,
        mimeType: mimeType,
        subject: subject,
        text: text,
      );

      log.info('Export shared: shop=$shopId, dataset=$dataset');
      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error('Failed to share export', error: error, stackTrace: stackTrace);
      return Result<void>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<ShopOrderImportSummary>> importShopOrders({
    required String shopId,
  }) async {
    try {
      final pickedFile = await _localDataSource.pickImportFile(
        allowedExtensions: const <String>['xlsx', 'csv'],
      );
      final summary = await _remoteDataSource.importShopOrders(
        shopId: shopId,
        fileName: pickedFile.fileName,
        bytes: pickedFile.bytes,
      );

      log.info(
        'Order spreadsheet imported: shop=$shopId, file=${pickedFile.fileName}',
      );
      return Result<ShopOrderImportSummary>.success(summary);
    } catch (error, stackTrace) {
      log.error(
        'Failed to import order spreadsheet',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<ShopOrderImportSummary>.failure(FailureMapper.from(error));
    }
  }

  String _buildFileName({
    required String shopName,
    required String dataset,
    required String extension,
  }) {
    final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final safeShopName = shopName
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
        .replaceAll(RegExp(r'^-+|-+$'), '');

    final normalizedShopName = safeShopName.isEmpty ? 'shop' : safeShopName;
    return '$normalizedShopName-$dataset-$timestamp.$extension';
  }
}
