import 'package:equatable/equatable.dart';

class ShopOrderImportSummary extends Equatable {
  const ShopOrderImportSummary({
    required this.filename,
    required this.format,
    required this.importedOrders,
    required this.importedItems,
    required this.processedRows,
    required this.summary,
  });

  final String filename;
  final String format;
  final int importedOrders;
  final int importedItems;
  final int processedRows;
  final String summary;

  @override
  List<Object?> get props => <Object?>[
    filename,
    format,
    importedOrders,
    importedItems,
    processedRows,
    summary,
  ];
}
