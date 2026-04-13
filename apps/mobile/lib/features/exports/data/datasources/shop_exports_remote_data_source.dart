import 'dart:typed_data';

import 'package:app_network/app_network.dart';

abstract class ShopExportsRemoteDataSource {
  Future<Uint8List> downloadShopDataset({
    required String shopId,
    required String dataset,
    required String extension,
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
    return _apiClient.getBytes('/shops/$shopId/exports/$dataset.$extension');
  }
}
