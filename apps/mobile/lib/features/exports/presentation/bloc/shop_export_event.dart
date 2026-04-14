import 'package:equatable/equatable.dart';

sealed class ShopExportEvent extends Equatable {
  const ShopExportEvent();

  @override
  List<Object?> get props => const [];
}

class ShopExportSaveRequested extends ShopExportEvent {
  const ShopExportSaveRequested({
    required this.shopId,
    required this.shopName,
    required this.dataset,
    required this.label,
    this.extension = 'csv',
    this.mimeType = 'text/csv',
  });

  final String shopId;
  final String shopName;
  final String dataset;
  final String label;
  final String extension;
  final String mimeType;

  @override
  List<Object?> get props => [
    shopId,
    shopName,
    dataset,
    label,
    extension,
    mimeType,
  ];
}

class ShopExportShareRequested extends ShopExportEvent {
  const ShopExportShareRequested({
    required this.shopId,
    required this.shopName,
    required this.dataset,
    required this.label,
    this.extension = 'csv',
    this.mimeType = 'text/csv',
  });

  final String shopId;
  final String shopName;
  final String dataset;
  final String label;
  final String extension;
  final String mimeType;

  @override
  List<Object?> get props => [
    shopId,
    shopName,
    dataset,
    label,
    extension,
    mimeType,
  ];
}

class ShopOrdersImportRequested extends ShopExportEvent {
  const ShopOrdersImportRequested({
    required this.shopId,
    required this.label,
  });

  final String shopId;
  final String label;

  @override
  List<Object?> get props => [shopId, label];
}

class ShopExportFeedbackDismissed extends ShopExportEvent {
  const ShopExportFeedbackDismissed();
}
