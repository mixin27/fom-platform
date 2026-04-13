import 'package:app_core/app_core.dart';

import '../repositories/shop_exports_repository.dart';

class ShareShopDatasetUseCase implements VoidUseCase<ShareShopDatasetParams> {
  const ShareShopDatasetUseCase(this._repository);

  final ShopExportsRepository _repository;

  @override
  Future<Result<void>> call(ShareShopDatasetParams params) {
    return _repository.shareShopDataset(
      shopId: params.shopId,
      shopName: params.shopName,
      dataset: params.dataset,
      extension: params.extension,
      mimeType: params.mimeType,
      subject: params.subject,
      text: params.text,
    );
  }
}

class ShareShopDatasetParams {
  const ShareShopDatasetParams({
    required this.shopId,
    required this.shopName,
    required this.dataset,
    required this.subject,
    this.text,
    this.extension = 'csv',
    this.mimeType = 'text/csv',
  });

  final String shopId;
  final String shopName;
  final String dataset;
  final String subject;
  final String? text;
  final String extension;
  final String mimeType;
}
