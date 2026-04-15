import '../../domain/entities/shop_order_import_summary.dart';

class ShopOrderImportSummaryModel extends ShopOrderImportSummary {
  const ShopOrderImportSummaryModel({
    required super.filename,
    required super.format,
    required super.importedOrders,
    required super.importedItems,
    required super.processedRows,
    required super.summary,
  });

  factory ShopOrderImportSummaryModel.fromJson(Map<String, dynamic> json) {
    return ShopOrderImportSummaryModel(
      filename: _asString(json['filename']),
      format: _asString(json['format']),
      importedOrders: _asInt(json['imported_orders']),
      importedItems: _asInt(json['imported_items']),
      processedRows: _asInt(json['processed_rows']),
      summary: _asString(json['summary']),
    );
  }
}

String _asString(dynamic value) {
  if (value == null) {
    return '';
  }

  return value.toString().trim();
}

int _asInt(dynamic value) {
  if (value is int) {
    return value;
  }

  return int.tryParse(_asString(value)) ?? 0;
}
