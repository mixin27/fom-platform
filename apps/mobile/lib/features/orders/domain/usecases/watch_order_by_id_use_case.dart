import "../entities/order_list_item.dart";
import "../repositories/orders_repository.dart";

class WatchOrderByIdUseCase {
  const WatchOrderByIdUseCase(this._repository);

  final OrdersRepository _repository;

  Stream<OrderListItem?> call({required String orderId}) {
    return _repository.watchOrderById(orderId: orderId);
  }
}
