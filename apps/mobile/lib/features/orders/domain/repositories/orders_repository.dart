import 'package:app_core/app_core.dart';

import '../entities/order_list_item.dart';
import '../entities/order_status.dart';

abstract class OrdersRepository {
  Stream<List<OrderListItem>> watchOrders({required String shopId});

  Future<Result<void>> refreshOrders({required String shopId});

  Future<Result<void>> updateOrderStatus({
    required String shopId,
    required String orderId,
    required OrderStatus status,
    String? note,
  });
}
