import '../../domain/entities/settings_billing_overview.dart';

class SettingsBillingOverviewModel extends SettingsBillingOverview {
  const SettingsBillingOverviewModel({
    required super.status,
    required super.autoRenews,
    required super.planCode,
    required super.planName,
    required super.planPrice,
    required super.planCurrency,
    required super.billingPeriod,
    required super.currentPeriodStart,
    required super.currentPeriodEnd,
    required super.outstandingBalance,
    required super.overdueInvoiceCount,
    required super.nextDueAt,
    required super.latestInvoiceStatus,
    required super.latestPaidAt,
    required super.invoiceCount,
    required super.latestInvoiceNumber,
    required super.availableFeatures,
  });

  factory SettingsBillingOverviewModel.fromJson(Map<String, dynamic> json) {
    final overview = _asNullableMap(json['overview']) ?? json;
    final invoices = _asMapList(json['invoices']);
    final latestInvoice = invoices.isEmpty ? null : invoices.first;
    final plan = _asNullableMap(json['plan']);
    final planItems = _asMapList(plan?['items']);

    return SettingsBillingOverviewModel(
      status: _asNullableString(overview['status']),
      autoRenews: _asBool(overview['auto_renews']),
      planCode: _asNullableString(overview['plan_code']),
      planName: _asNullableString(overview['plan_name']),
      planPrice: _asNullableInt(overview['plan_price']),
      planCurrency: _asNullableString(overview['plan_currency']),
      billingPeriod: _asNullableString(overview['billing_period']),
      currentPeriodStart: _asDateTime(overview['current_period_start']),
      currentPeriodEnd: _asDateTime(overview['current_period_end']),
      outstandingBalance: _asInt(overview['outstanding_balance']),
      overdueInvoiceCount: _asInt(overview['overdue_invoice_count']),
      nextDueAt: _asDateTime(overview['next_due_at']),
      latestInvoiceStatus: _asNullableString(overview['latest_invoice_status']),
      latestPaidAt: _asDateTime(overview['latest_paid_at']),
      invoiceCount: invoices.isNotEmpty
          ? invoices.length
          : _asInt(overview['invoice_count']),
      latestInvoiceNumber: _asNullableString(
        latestInvoice == null
            ? overview['latest_invoice_number']
            : latestInvoice['invoice_no'],
      ),
      availableFeatures: planItems
          .where(
            (item) =>
                _asNullableString(item['availability_status']) == 'available',
          )
          .map((item) => _asString(item['code']))
          .where((code) => code.isNotEmpty)
          .toList(growable: false),
    );
  }
}

Map<String, dynamic>? _asNullableMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }

  return null;
}

List<Map<String, dynamic>> _asMapList(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((entry) => Map<String, dynamic>.from(entry))
        .toList(growable: false);
  }

  return const <Map<String, dynamic>>[];
}

String _asString(dynamic value) {
  if (value == null) {
    return '';
  }

  return value.toString().trim();
}

String? _asNullableString(dynamic value) {
  final normalized = _asString(value);
  if (normalized.isEmpty) {
    return null;
  }

  return normalized;
}

DateTime? _asDateTime(dynamic value) {
  final normalized = _asString(value);
  if (normalized.isEmpty) {
    return null;
  }

  return DateTime.tryParse(normalized);
}

int _asInt(dynamic value) {
  if (value is int) {
    return value;
  }

  return int.tryParse(_asString(value)) ?? 0;
}

int? _asNullableInt(dynamic value) {
  if (value == null) {
    return null;
  }

  return int.tryParse(_asString(value));
}

bool _asBool(dynamic value) {
  if (value is bool) {
    return value;
  }

  final normalized = _asString(value).toLowerCase();
  return normalized == 'true' || normalized == '1';
}
