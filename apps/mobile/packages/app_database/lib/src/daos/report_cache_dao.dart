import "package:app_database/src/app_database.dart";
import "package:app_database/src/tables/report_cache_records.dart";
import "package:drift/drift.dart";

part "report_cache_dao.g.dart";

@DriftAccessor(tables: [ReportCacheRecords])
class ReportCacheDao extends DatabaseAccessor<AppDatabase>
    with _$ReportCacheDaoMixin {
  ReportCacheDao(super.db);

  Stream<ReportCacheRecord?> watchReport({
    required String shopId,
    required String periodType,
    required String periodKey,
  }) {
    return (select(reportCacheRecords)..where(
          (table) =>
              table.shopId.equals(shopId) &
              table.periodType.equals(periodType) &
              table.periodKey.equals(periodKey),
        ))
        .watchSingleOrNull();
  }

  Future<void> upsertReport(ReportCacheRecordsCompanion report) async {
    await into(reportCacheRecords).insertOnConflictUpdate(report);
  }
}
