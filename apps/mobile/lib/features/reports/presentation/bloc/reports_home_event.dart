import "package:equatable/equatable.dart";

import "../../domain/entities/report_period.dart";
import "../../domain/entities/shop_report_snapshot.dart";

sealed class ReportsHomeEvent extends Equatable {
  const ReportsHomeEvent();

  @override
  List<Object?> get props => const [];
}

class ReportsHomeStarted extends ReportsHomeEvent {
  const ReportsHomeStarted({required this.shopId, required this.shopName});

  final String shopId;
  final String shopName;

  @override
  List<Object?> get props => [shopId, shopName];
}

class ReportsHomeRefreshRequested extends ReportsHomeEvent {
  const ReportsHomeRefreshRequested({this.silent = false});

  final bool silent;

  @override
  List<Object?> get props => [silent];
}

class ReportsHomePeriodChanged extends ReportsHomeEvent {
  const ReportsHomePeriodChanged(this.period);

  final ReportPeriod period;

  @override
  List<Object?> get props => [period];
}

class ReportsHomePreviousRequested extends ReportsHomeEvent {
  const ReportsHomePreviousRequested();
}

class ReportsHomeNextRequested extends ReportsHomeEvent {
  const ReportsHomeNextRequested();
}

class ReportsHomeReportStreamUpdated extends ReportsHomeEvent {
  const ReportsHomeReportStreamUpdated(this.report);

  final ShopReportSnapshot? report;

  @override
  List<Object?> get props => [report];
}

class ReportsHomeConnectionChanged extends ReportsHomeEvent {
  const ReportsHomeConnectionChanged({required this.isOnline});

  final bool isOnline;

  @override
  List<Object?> get props => [isOnline];
}

class ReportsHomeErrorDismissed extends ReportsHomeEvent {
  const ReportsHomeErrorDismissed();
}
