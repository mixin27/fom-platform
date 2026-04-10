import '../entities/order_list_item.dart';
import '../repositories/orders_repository.dart';

class WatchOrdersUseCase {
  const WatchOrdersUseCase(this._repository);

  final OrdersRepository _repository;

  Stream<List<OrderListItem>> call({required String shopId}) {
    return _repository.watchOrders(shopId: shopId);
  }
}
