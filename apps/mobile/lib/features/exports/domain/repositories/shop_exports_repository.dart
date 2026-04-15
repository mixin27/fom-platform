import 'package:app_core/app_core.dart';

import '../entities/shop_export_file.dart';
import '../entities/shop_order_import_summary.dart';

abstract class ShopExportsRepository {
  Future<Result<ShopExportFile>> saveShopDataset({
    required String shopId,
    required String shopName,
    required String dataset,
    required String extension,
    required String mimeType,
  });

  Future<Result<void>> shareShopDataset({
    required String shopId,
    required String shopName,
    required String dataset,
    required String extension,
    required String mimeType,
    required String subject,
    String? text,
  });

  Future<Result<ShopOrderImportSummary>> importShopOrders({
    required String shopId,
  });
}
