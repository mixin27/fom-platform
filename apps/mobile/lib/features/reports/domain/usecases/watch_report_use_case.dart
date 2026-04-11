import "../entities/report_period.dart";
import "../entities/shop_report_snapshot.dart";
import "../repositories/reports_repository.dart";

class WatchReportUseCase {
  const WatchReportUseCase(this._repository);

  final ReportsRepository _repository;

  Stream<ShopReportSnapshot?> call({
    required String shopId,
    required ReportPeriod period,
    required String periodKey,
  }) {
    return _repository.watchReport(
      shopId: shopId,
      period: period,
      periodKey: periodKey,
    );
  }
}
