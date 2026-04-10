import 'package:app_core/app_core.dart';

import '../repositories/customers_repository.dart';

class RefreshCustomerDetailUseCase
    implements VoidUseCase<RefreshCustomerDetailParams> {
  const RefreshCustomerDetailUseCase(this._repository);

  final CustomersRepository _repository;

  @override
  Future<Result<void>> call(RefreshCustomerDetailParams params) {
    return _repository.refreshCustomerDetail(
      shopId: params.shopId,
      customerId: params.customerId,
    );
  }
}

class RefreshCustomerDetailParams {
  const RefreshCustomerDetailParams({
    required this.shopId,
    required this.customerId,
  });

  final String shopId;
  final String customerId;
}
