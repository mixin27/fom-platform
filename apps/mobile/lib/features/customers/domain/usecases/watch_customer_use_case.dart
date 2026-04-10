import '../entities/customer_list_item.dart';
import '../repositories/customers_repository.dart';

class WatchCustomerUseCase {
  const WatchCustomerUseCase(this._repository);

  final CustomersRepository _repository;

  Stream<CustomerListItem?> call({
    required String shopId,
    required String customerId,
  }) {
    return _repository.watchCustomer(shopId: shopId, customerId: customerId);
  }
}
