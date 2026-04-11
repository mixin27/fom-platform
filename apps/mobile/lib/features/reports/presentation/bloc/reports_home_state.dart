import "package:equatable/equatable.dart";

import "../../domain/entities/report_period.dart";
import "../../domain/entities/shop_report_snapshot.dart";

enum ReportsHomeStatus { initial, loading, ready, error }

class ReportsHomeState extends Equatable {
  const ReportsHomeState({
    this.status = ReportsHomeStatus.initial,
    this.shopId,
    this.shopName = "My Shop",
    this.selectedPeriod = ReportPeriod.daily,
    this.anchorDate,
    this.report,
    this.isRefreshing = false,
    this.errorMessage,
    this.lastRefreshedAt,
  });

  final ReportsHomeStatus status;
  final String? shopId;
  final String shopName;
  final ReportPeriod selectedPeriod;
  final DateTime? anchorDate;
  final ShopReportSnapshot? report;
  final bool isRefreshing;
  final String? errorMessage;
  final DateTime? lastRefreshedAt;

  bool get hasShop => (shopId ?? "").trim().isNotEmpty;

  bool get hasReport => report != null;

  DateTime get resolvedAnchorDate =>
      anchorDate ?? DateTime.fromMillisecondsSinceEpoch(0);

  String get activePeriodKey => buildReportPeriodKey(
    period: selectedPeriod,
    anchorDate: resolvedAnchorDate,
  );

  bool get canNavigateNext => canNavigateToNextReportPeriod(
    period: selectedPeriod,
    anchorDate: resolvedAnchorDate,
  );

  ReportsHomeState copyWith({
    ReportsHomeStatus? status,
    String? shopId,
    String? shopName,
    ReportPeriod? selectedPeriod,
    DateTime? anchorDate,
    ShopReportSnapshot? report,
    bool clearReport = false,
    bool? isRefreshing,
    String? errorMessage,
    bool clearError = false,
    DateTime? lastRefreshedAt,
  }) {
    return ReportsHomeState(
      status: status ?? this.status,
      shopId: shopId ?? this.shopId,
      shopName: shopName ?? this.shopName,
      selectedPeriod: selectedPeriod ?? this.selectedPeriod,
      anchorDate: anchorDate ?? this.anchorDate,
      report: clearReport ? null : (report ?? this.report),
      isRefreshing: isRefreshing ?? this.isRefreshing,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastRefreshedAt: lastRefreshedAt ?? this.lastRefreshedAt,
    );
  }

  @override
  List<Object?> get props => [
    status,
    shopId,
    shopName,
    selectedPeriod,
    anchorDate,
    report,
    isRefreshing,
    errorMessage,
    lastRefreshedAt,
  ];
}
