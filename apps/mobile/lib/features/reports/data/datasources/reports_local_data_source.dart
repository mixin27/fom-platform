import "package:app_database/app_database.dart";

import "../models/shop_report_snapshot_model.dart";

abstract class ReportsLocalDataSource {
  Stream<ShopReportSnapshotModel?> watchReport({
    required String shopId,
    required String periodType,
    required String periodKey,
  });

  Future<void> upsertReport({
    required ShopReportSnapshotModel report,
    required DateTime syncedAt,
  });
}

class ReportsLocalDataSourceImpl implements ReportsLocalDataSource {
  ReportsLocalDataSourceImpl(this._reportCacheDao);

  final ReportCacheDao _reportCacheDao;

  @override
  Stream<ShopReportSnapshotModel?> watchReport({
    required String shopId,
    required String periodType,
    required String periodKey,
  }) {
    return _reportCacheDao
        .watchReport(
          shopId: shopId,
          periodType: periodType,
          periodKey: periodKey,
        )
        .map(
          (row) =>
              row == null ? null : ShopReportSnapshotModel.fromCacheRecord(row),
        );
  }

  @override
  Future<void> upsertReport({
    required ShopReportSnapshotModel report,
    required DateTime syncedAt,
  }) {
    return _reportCacheDao.upsertReport(report.toCompanion(syncedAt: syncedAt));
  }
}
