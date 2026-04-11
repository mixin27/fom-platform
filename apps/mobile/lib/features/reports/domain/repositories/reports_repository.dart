import "package:app_core/app_core.dart";

import "../entities/report_period.dart";
import "../entities/shop_report_snapshot.dart";

abstract class ReportsRepository {
  Stream<ShopReportSnapshot?> watchReport({
    required String shopId,
    required ReportPeriod period,
    required String periodKey,
  });

  Future<Result<void>> refreshReport({
    required String shopId,
    required ReportPeriod period,
    required DateTime anchorDate,
  });
}
