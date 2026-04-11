import "package:app_network/app_network.dart";

import "../models/shop_report_snapshot_model.dart";

abstract class ReportsRemoteDataSource {
  Future<ShopReportSnapshotModel> fetchDailySummary({
    required String shopId,
    required String date,
  });

  Future<ShopReportSnapshotModel> fetchWeeklyReport({
    required String shopId,
    required String date,
  });

  Future<ShopReportSnapshotModel> fetchMonthlyReport({
    required String shopId,
    required String month,
  });
}

class ReportsRemoteDataSourceImpl implements ReportsRemoteDataSource {
  ReportsRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<ShopReportSnapshotModel> fetchDailySummary({
    required String shopId,
    required String date,
  }) async {
    final payload = await _apiClient.getMap(
      "/shops/$shopId/summaries/daily",
      queryParameters: <String, dynamic>{"date": date},
    );

    return ShopReportSnapshotModel.fromJson(payload);
  }

  @override
  Future<ShopReportSnapshotModel> fetchWeeklyReport({
    required String shopId,
    required String date,
  }) async {
    final payload = await _apiClient.getMap(
      "/shops/$shopId/reports/weekly",
      queryParameters: <String, dynamic>{"date": date},
    );

    return ShopReportSnapshotModel.fromJson(payload);
  }

  @override
  Future<ShopReportSnapshotModel> fetchMonthlyReport({
    required String shopId,
    required String month,
  }) async {
    final payload = await _apiClient.getMap(
      "/shops/$shopId/reports/monthly",
      queryParameters: <String, dynamic>{"month": month},
    );

    return ShopReportSnapshotModel.fromJson(payload);
  }
}
