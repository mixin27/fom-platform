import 'package:app_core/app_core.dart';

import '../entities/customer_draft.dart';
import '../entities/customer_list_item.dart';
import '../repositories/customers_repository.dart';

class CreateCustomerUseCase
    implements UseCase<CustomerListItem, CreateCustomerParams> {
  const CreateCustomerUseCase(this._repository);

  final CustomersRepository _repository;

  @override
  Future<Result<CustomerListItem>> call(CreateCustomerParams params) {
    return _repository.createCustomer(
      shopId: params.shopId,
      draft: params.draft,
    );
  }
}

class CreateCustomerParams {
  const CreateCustomerParams({required this.shopId, required this.draft});

  final String shopId;
  final CustomerDraft draft;
}
