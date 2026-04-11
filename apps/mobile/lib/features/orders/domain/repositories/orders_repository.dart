import 'package:app_core/app_core.dart';

import '../entities/order_details.dart';
import '../entities/order_entry_draft.dart';
import '../entities/order_list_item.dart';
import '../entities/order_status.dart';
import '../entities/parsed_order_message.dart';

abstract class OrdersRepository {
  Stream<List<OrderListItem>> watchOrders({required String shopId});

  Stream<OrderListItem?> watchOrderById({required String orderId});

  Future<Result<void>> refreshOrders({required String shopId});

  Future<Result<OrderDetails>> getOrderDetails({
    required String shopId,
    required String orderId,
  });

  Future<Result<OrderListItem>> createOrder({
    required String shopId,
    required OrderEntryDraft draft,
  });

  Future<Result<ParsedOrderMessage>> parseOrderMessage({
    required String shopId,
    required String message,
  });

  Future<Result<void>> updateOrderStatus({
    required String shopId,
    required String orderId,
    required OrderStatus status,
    String? note,
  });
}
