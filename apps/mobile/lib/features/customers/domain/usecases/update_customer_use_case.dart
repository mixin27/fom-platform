import 'package:app_core/app_core.dart';

import '../entities/customer_draft.dart';
import '../entities/customer_list_item.dart';
import '../repositories/customers_repository.dart';

class UpdateCustomerUseCase
    implements UseCase<CustomerListItem, UpdateCustomerParams> {
  const UpdateCustomerUseCase(this._repository);

  final CustomersRepository _repository;

  @override
  Future<Result<CustomerListItem>> call(UpdateCustomerParams params) {
    return _repository.updateCustomer(
      shopId: params.shopId,
      customerId: params.customerId,
      draft: params.draft,
    );
  }
}

class UpdateCustomerParams {
  const UpdateCustomerParams({
    required this.shopId,
    required this.customerId,
    required this.draft,
  });

  final String shopId;
  final String customerId;
  final CustomerDraft draft;
}
