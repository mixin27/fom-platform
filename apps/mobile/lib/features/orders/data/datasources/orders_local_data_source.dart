import 'package:app_database/app_database.dart';

import '../models/order_list_item_model.dart';

abstract class OrdersLocalDataSource {
  Stream<List<OrderListItemModel>> watchOrders({required String shopId});

  Future<void> replaceOrdersForShop({
    required String shopId,
    required List<OrderListItemModel> orders,
    required DateTime syncedAt,
  });

  Future<void> upsertOrder({
    required OrderListItemModel order,
    required DateTime syncedAt,
  });
}

class OrdersLocalDataSourceImpl implements OrdersLocalDataSource {
  OrdersLocalDataSourceImpl(this._orderCacheDao);

  final OrderCacheDao _orderCacheDao;

  @override
  Stream<List<OrderListItemModel>> watchOrders({required String shopId}) {
    return _orderCacheDao
        .watchOrdersByShop(shopId)
        .map(
          (rows) => rows
              .map(OrderListItemModel.fromCacheRecord)
              .toList(growable: false),
        );
  }

  @override
  Future<void> replaceOrdersForShop({
    required String shopId,
    required List<OrderListItemModel> orders,
    required DateTime syncedAt,
  }) async {
    final companions = orders
        .map((order) => order.toCompanion(syncedAt: syncedAt))
        .toList(growable: false);

    await _orderCacheDao.replaceOrdersForShop(
      shopId: shopId,
      orders: companions,
    );
  }

  @override
  Future<void> upsertOrder({
    required OrderListItemModel order,
    required DateTime syncedAt,
  }) {
    return _orderCacheDao.upsertOrder(order.toCompanion(syncedAt: syncedAt));
  }
}
