import "package:app_core/app_core.dart";

import "../entities/order_entry_draft.dart";
import "../entities/order_list_item.dart";
import "../repositories/orders_repository.dart";

class CreateOrderUseCase implements UseCase<OrderListItem, CreateOrderParams> {
  const CreateOrderUseCase(this._repository);

  final OrdersRepository _repository;

  @override
  Future<Result<OrderListItem>> call(CreateOrderParams params) {
    return _repository.createOrder(shopId: params.shopId, draft: params.draft);
  }
}

class CreateOrderParams {
  const CreateOrderParams({required this.shopId, required this.draft});

  final String shopId;
  final OrderEntryDraft draft;
}
