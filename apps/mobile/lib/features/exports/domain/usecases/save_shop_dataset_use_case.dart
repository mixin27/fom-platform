import 'package:app_core/app_core.dart';

import '../entities/shop_export_file.dart';
import '../repositories/shop_exports_repository.dart';

class SaveShopDatasetUseCase
    implements UseCase<ShopExportFile, SaveShopDatasetParams> {
  const SaveShopDatasetUseCase(this._repository);

  final ShopExportsRepository _repository;

  @override
  Future<Result<ShopExportFile>> call(SaveShopDatasetParams params) {
    return _repository.saveShopDataset(
      shopId: params.shopId,
      shopName: params.shopName,
      dataset: params.dataset,
      extension: params.extension,
      mimeType: params.mimeType,
    );
  }
}

class SaveShopDatasetParams {
  const SaveShopDatasetParams({
    required this.shopId,
    required this.shopName,
    required this.dataset,
    this.extension = 'csv',
    this.mimeType = 'text/csv',
  });

  final String shopId;
  final String shopName;
  final String dataset;
  final String extension;
  final String mimeType;
}
