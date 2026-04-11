import "package:app_core/app_core.dart";

import "../entities/order_details.dart";
import "../repositories/orders_repository.dart";

class GetOrderDetailsUseCase
    implements UseCase<OrderDetails, GetOrderDetailsParams> {
  const GetOrderDetailsUseCase(this._repository);

  final OrdersRepository _repository;

  @override
  Future<Result<OrderDetails>> call(GetOrderDetailsParams params) {
    return _repository.getOrderDetails(
      shopId: params.shopId,
      orderId: params.orderId,
    );
  }
}

class GetOrderDetailsParams {
  const GetOrderDetailsParams({required this.shopId, required this.orderId});

  final String shopId;
  final String orderId;
}
