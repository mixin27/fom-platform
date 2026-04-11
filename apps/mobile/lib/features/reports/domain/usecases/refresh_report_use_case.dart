import "package:app_core/app_core.dart";

import "../entities/report_period.dart";
import "../repositories/reports_repository.dart";

class RefreshReportUseCase implements VoidUseCase<RefreshReportParams> {
  const RefreshReportUseCase(this._repository);

  final ReportsRepository _repository;

  @override
  Future<Result<void>> call(RefreshReportParams params) {
    return _repository.refreshReport(
      shopId: params.shopId,
      period: params.period,
      anchorDate: params.anchorDate,
    );
  }
}

class RefreshReportParams {
  const RefreshReportParams({
    required this.shopId,
    required this.period,
    required this.anchorDate,
  });

  final String shopId;
  final ReportPeriod period;
  final DateTime anchorDate;
}
