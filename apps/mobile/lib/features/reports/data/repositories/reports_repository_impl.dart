import "package:app_core/app_core.dart";
import "package:app_logger/app_logger.dart";

import "../../domain/entities/report_period.dart";
import "../../domain/entities/shop_report_snapshot.dart";
import "../../domain/repositories/reports_repository.dart";
import "../datasources/reports_local_data_source.dart";
import "../datasources/reports_remote_data_source.dart";

class ReportsRepositoryImpl with LoggerMixin implements ReportsRepository {
  ReportsRepositoryImpl(
    this._localDataSource,
    this._remoteDataSource, {
    AppLogger? logger,
  }) : _logger = logger ?? AppLogger(enabled: false);

  final ReportsLocalDataSource _localDataSource;
  final ReportsRemoteDataSource _remoteDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext("ReportsRepository");

  @override
  Stream<ShopReportSnapshot?> watchReport({
    required String shopId,
    required ReportPeriod period,
    required String periodKey,
  }) {
    return _localDataSource.watchReport(
      shopId: shopId,
      periodType: period.apiValue,
      periodKey: periodKey,
    );
  }

  @override
  Future<Result<void>> refreshReport({
    required String shopId,
    required ReportPeriod period,
    required DateTime anchorDate,
  }) async {
    try {
      final normalizedAnchor = normalizeReportAnchorDate(period, anchorDate);
      log.info(
        "Fetching ${period.apiValue} report for shop=$shopId (anchor=${formatDateKey(normalizedAnchor)})",
      );

      final report = switch (period) {
        ReportPeriod.daily => await _remoteDataSource.fetchDailySummary(
          shopId: shopId,
          date: formatDateKey(normalizedAnchor),
        ),
        ReportPeriod.weekly => await _remoteDataSource.fetchWeeklyReport(
          shopId: shopId,
          date: formatDateKey(normalizedAnchor),
        ),
        ReportPeriod.monthly => await _remoteDataSource.fetchMonthlyReport(
          shopId: shopId,
          month: formatMonthKey(normalizedAnchor),
        ),
      };

      await _localDataSource.upsertReport(
        report: report,
        syncedAt: DateTime.now(),
      );

      log.info(
        "Report cache refreshed: shop=$shopId, period=${report.period.apiValue}, key=${report.periodKey}",
      );
      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error(
        "Failed to refresh report",
        error: error,
        stackTrace: stackTrace,
      );
      return Result<void>.failure(FailureMapper.from(error));
    }
  }
}
