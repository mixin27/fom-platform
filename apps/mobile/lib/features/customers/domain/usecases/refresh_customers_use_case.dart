import 'package:app_core/app_core.dart';

import '../repositories/customers_repository.dart';

class RefreshCustomersUseCase implements VoidUseCase<RefreshCustomersParams> {
  const RefreshCustomersUseCase(this._repository);

  final CustomersRepository _repository;

  @override
  Future<Result<void>> call(RefreshCustomersParams params) {
    return _repository.refreshCustomers(shopId: params.shopId);
  }
}

class RefreshCustomersParams {
  const RefreshCustomersParams({required this.shopId});

  final String shopId;
}
