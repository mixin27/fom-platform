enum ReportPeriod { daily, weekly, monthly }

extension ReportPeriodX on ReportPeriod {
  String get apiValue {
    switch (this) {
      case ReportPeriod.daily:
        return "daily";
      case ReportPeriod.weekly:
        return "weekly";
      case ReportPeriod.monthly:
        return "monthly";
    }
  }

  String get tabLabel {
    switch (this) {
      case ReportPeriod.daily:
        return "Day";
      case ReportPeriod.weekly:
        return "Week";
      case ReportPeriod.monthly:
        return "Month";
    }
  }

  String get titleLabel {
    switch (this) {
      case ReportPeriod.daily:
        return "Daily Report";
      case ReportPeriod.weekly:
        return "Weekly Report";
      case ReportPeriod.monthly:
        return "Monthly Report";
    }
  }

  String get titleLabelMyanmar {
    switch (this) {
      case ReportPeriod.daily:
        return "နေ့စဉ်အစီရင်ခံစာ";
      case ReportPeriod.weekly:
        return "အပတ်အစီရင်ခံစာ";
      case ReportPeriod.monthly:
        return "လအစီရင်ခံစာ";
    }
  }
}

DateTime normalizeReportAnchorDate(ReportPeriod period, DateTime value) {
  final date = DateTime(value.year, value.month, value.day);

  switch (period) {
    case ReportPeriod.daily:
    case ReportPeriod.weekly:
      return date;
    case ReportPeriod.monthly:
      return DateTime(date.year, date.month);
  }
}

DateTime startOfReportWeek(DateTime value) {
  final date = DateTime(value.year, value.month, value.day);
  return date.subtract(Duration(days: date.weekday - DateTime.monday));
}

DateTime shiftReportAnchorDate({
  required ReportPeriod period,
  required DateTime anchorDate,
  required int step,
}) {
  switch (period) {
    case ReportPeriod.daily:
      return DateTime(anchorDate.year, anchorDate.month, anchorDate.day + step);
    case ReportPeriod.weekly:
      return DateTime(
        anchorDate.year,
        anchorDate.month,
        anchorDate.day + (step * 7),
      );
    case ReportPeriod.monthly:
      final shiftedMonth = DateTime(anchorDate.year, anchorDate.month + step);
      return DateTime(shiftedMonth.year, shiftedMonth.month);
  }
}

String buildReportPeriodKey({
  required ReportPeriod period,
  required DateTime anchorDate,
}) {
  switch (period) {
    case ReportPeriod.daily:
      return formatDateKey(anchorDate);
    case ReportPeriod.weekly:
      return formatDateKey(startOfReportWeek(anchorDate));
    case ReportPeriod.monthly:
      return formatMonthKey(anchorDate);
  }
}

String formatDateKey(DateTime value) {
  final year = value.year.toString().padLeft(4, "0");
  final month = value.month.toString().padLeft(2, "0");
  final day = value.day.toString().padLeft(2, "0");
  return "$year-$month-$day";
}

String formatMonthKey(DateTime value) {
  final year = value.year.toString().padLeft(4, "0");
  final month = value.month.toString().padLeft(2, "0");
  return "$year-$month";
}

bool canNavigateToNextReportPeriod({
  required ReportPeriod period,
  required DateTime anchorDate,
  DateTime? now,
}) {
  final current = normalizeReportAnchorDate(period, now ?? DateTime.now());
  final selected = normalizeReportAnchorDate(period, anchorDate);

  switch (period) {
    case ReportPeriod.daily:
      return selected.isBefore(current);
    case ReportPeriod.weekly:
      return startOfReportWeek(selected).isBefore(startOfReportWeek(current));
    case ReportPeriod.monthly:
      return DateTime(
        selected.year,
        selected.month,
      ).isBefore(DateTime(current.year, current.month));
  }
}
