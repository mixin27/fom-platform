import 'dart:convert';
import 'dart:typed_data';

import 'package:app_network/app_network.dart';

import '../models/shop_order_import_summary_model.dart';

abstract class ShopExportsRemoteDataSource {
  Future<Uint8List> downloadShopDataset({
    required String shopId,
    required String dataset,
    required String extension,
  });

  Future<ShopOrderImportSummaryModel> importShopOrders({
    required String shopId,
    required String fileName,
    required Uint8List bytes,
  });
}

class ShopExportsRemoteDataSourceImpl implements ShopExportsRemoteDataSource {
  ShopExportsRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<Uint8List> downloadShopDataset({
    required String shopId,
    required String dataset,
    required String extension,
  }) {
    final normalizedDataset = dataset.trim();
    final path = normalizedDataset == 'orders-import-template'
        ? '/shops/$shopId/orders/import-template.$extension'
        : '/shops/$shopId/exports/$normalizedDataset.$extension';
    return _apiClient.getBytes(path);
  }

  @override
  Future<ShopOrderImportSummaryModel> importShopOrders({
    required String shopId,
    required String fileName,
    required Uint8List bytes,
  }) async {
    final payload = await _apiClient.postMap(
      '/shops/$shopId/orders/import-spreadsheet',
      data: <String, dynamic>{
        'filename': fileName.trim(),
        'content_base64': base64Encode(bytes),
      },
    );

    return ShopOrderImportSummaryModel.fromJson(payload);
  }
}
