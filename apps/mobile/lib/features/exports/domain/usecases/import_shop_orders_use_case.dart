import 'package:app_core/app_core.dart';
import 'package:equatable/equatable.dart';

import '../entities/shop_order_import_summary.dart';
import '../repositories/shop_exports_repository.dart';

class ImportShopOrdersUseCase
    implements UseCase<ShopOrderImportSummary, ImportShopOrdersParams> {
  const ImportShopOrdersUseCase(this._repository);

  final ShopExportsRepository _repository;

  @override
  Future<Result<ShopOrderImportSummary>> call(ImportShopOrdersParams params) {
    return _repository.importShopOrders(shopId: params.shopId);
  }
}

class ImportShopOrdersParams extends Equatable {
  const ImportShopOrdersParams({required this.shopId});

  final String shopId;

  @override
  List<Object?> get props => <Object?>[shopId];
}
