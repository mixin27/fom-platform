import 'package:app_core/app_core.dart';

import '../repositories/customers_repository.dart';

class DeleteCustomerUseCase implements VoidUseCase<DeleteCustomerParams> {
  const DeleteCustomerUseCase(this._repository);

  final CustomersRepository _repository;

  @override
  Future<Result<void>> call(DeleteCustomerParams params) {
    return _repository.deleteCustomer(
      shopId: params.shopId,
      customerId: params.customerId,
    );
  }
}

class DeleteCustomerParams {
  const DeleteCustomerParams({required this.shopId, required this.customerId});

  final String shopId;
  final String customerId;
}
