import 'package:app_core/app_core.dart';

import '../repositories/orders_repository.dart';

class RefreshOrdersUseCase implements VoidUseCase<RefreshOrdersParams> {
  const RefreshOrdersUseCase(this._repository);

  final OrdersRepository _repository;

  @override
  Future<Result<void>> call(RefreshOrdersParams params) {
    return _repository.refreshOrders(shopId: params.shopId);
  }
}

class RefreshOrdersParams {
  const RefreshOrdersParams({required this.shopId});

  final String shopId;
}
