import 'package:equatable/equatable.dart';

class SettingsBillingOverview extends Equatable {
  const SettingsBillingOverview({
    required this.status,
    required this.autoRenews,
    required this.planCode,
    required this.planName,
    required this.planPrice,
    required this.planCurrency,
    required this.billingPeriod,
    required this.currentPeriodStart,
    required this.currentPeriodEnd,
    required this.outstandingBalance,
    required this.overdueInvoiceCount,
    required this.nextDueAt,
    required this.latestInvoiceStatus,
    required this.latestPaidAt,
    required this.invoiceCount,
    required this.latestInvoiceNumber,
    required this.availableFeatures,
  });

  final String? status;
  final bool autoRenews;
  final String? planCode;
  final String? planName;
  final int? planPrice;
  final String? planCurrency;
  final String? billingPeriod;
  final DateTime? currentPeriodStart;
  final DateTime? currentPeriodEnd;
  final int outstandingBalance;
  final int overdueInvoiceCount;
  final DateTime? nextDueAt;
  final String? latestInvoiceStatus;
  final DateTime? latestPaidAt;
  final int invoiceCount;
  final String? latestInvoiceNumber;
  final List<String> availableFeatures;

  bool get isTrialing => (status ?? '').trim().toLowerCase() == 'trialing';

  bool hasFeature(String code) {
    return availableFeatures.contains(code.trim());
  }

  @override
  List<Object?> get props => <Object?>[
    status,
    autoRenews,
    planCode,
    planName,
    planPrice,
    planCurrency,
    billingPeriod,
    currentPeriodStart,
    currentPeriodEnd,
    outstandingBalance,
    overdueInvoiceCount,
    nextDueAt,
    latestInvoiceStatus,
    latestPaidAt,
    invoiceCount,
    latestInvoiceNumber,
    availableFeatures,
  ];
}
