import '../entities/customer_list_item.dart';
import '../repositories/customers_repository.dart';

class WatchCustomersUseCase {
  const WatchCustomersUseCase(this._repository);

  final CustomersRepository _repository;

  Stream<List<CustomerListItem>> call({required String shopId}) {
    return _repository.watchCustomers(shopId: shopId);
  }
}
