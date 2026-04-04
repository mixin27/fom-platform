import "package:flutter/material.dart";
import "package:intl/intl.dart";

/// Executes format date short.
String formatDateShort(BuildContext context, DateTime value) {
  final locale = Localizations.localeOf(context).toString();
  return DateFormat.yMMMd(locale).format(value);
}

/// Executes format number.
String formatNumber(BuildContext context, num value) {
  final locale = Localizations.localeOf(context).toString();
  return NumberFormat.decimalPattern(locale).format(value);
}

/// Executes format date range short.
String formatDateRangeShort(
  BuildContext context,
  DateTime start,
  DateTime end,
) {
  final locale = Localizations.localeOf(context).toString();
  final punctuation = _rangePunctuation(locale);
  if (_isSameDay(start, end)) {
    return DateFormat.yMMMd(locale).format(start);
  }

  if (start.year == end.year && start.month == end.month) {
    final startText = DateFormat.MMMd(locale).format(start);
    final endDay = DateFormat.d(locale).format(end);
    final year = DateFormat.y(locale).format(end);
    return "$startText${punctuation.rangeSeparator}$endDay"
        "${punctuation.yearSeparator}$year";
  }

  if (start.year == end.year) {
    final startText = DateFormat.MMMd(locale).format(start);
    final endText = DateFormat.MMMd(locale).format(end);
    final year = DateFormat.y(locale).format(end);
    return "$startText${punctuation.rangeSeparator}$endText"
        "${punctuation.yearSeparator}$year";
  }

  final startText = DateFormat.yMMMd(locale).format(start);
  final endText = DateFormat.yMMMd(locale).format(end);
  return "$startText${punctuation.rangeSeparator}$endText";
}

bool _isSameDay(DateTime a, DateTime b) {
  return a.year == b.year && a.month == b.month && a.day == b.day;
}

_RangePunctuation _rangePunctuation(String locale) {
  final languageCode = locale.split("_").first;
  switch (languageCode) {
    case "my":
      return const _RangePunctuation(
        rangeSeparator: " – ",
        yearSeparator: "၊ ",
      );
    case "en":
    default:
      return const _RangePunctuation(
        rangeSeparator: " – ",
        yearSeparator: ", ",
      );
  }
}

/// Represents Range Punctuation.
class _RangePunctuation {
  const _RangePunctuation({
    required this.rangeSeparator,
    required this.yearSeparator,
  });

  final String rangeSeparator;
  final String yearSeparator;
}
