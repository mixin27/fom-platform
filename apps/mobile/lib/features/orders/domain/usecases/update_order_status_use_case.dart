import 'package:app_core/app_core.dart';

import '../entities/order_status.dart';
import '../repositories/orders_repository.dart';

class UpdateOrderStatusUseCase implements VoidUseCase<UpdateOrderStatusParams> {
  const UpdateOrderStatusUseCase(this._repository);

  final OrdersRepository _repository;

  @override
  Future<Result<void>> call(UpdateOrderStatusParams params) {
    return _repository.updateOrderStatus(
      shopId: params.shopId,
      orderId: params.orderId,
      status: params.status,
      note: params.note,
    );
  }
}

class UpdateOrderStatusParams {
  const UpdateOrderStatusParams({
    required this.shopId,
    required this.orderId,
    required this.status,
    this.note,
  });

  final String shopId;
  final String orderId;
  final OrderStatus status;
  final String? note;
}
