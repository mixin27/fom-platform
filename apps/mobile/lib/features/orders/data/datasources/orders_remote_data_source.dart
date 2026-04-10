import 'package:app_network/app_network.dart';

import '../models/order_list_item_model.dart';

abstract class OrdersRemoteDataSource {
  Future<List<OrderListItemModel>> fetchOrders({
    required String shopId,
    int limit,
  });

  Future<OrderListItemModel> updateOrderStatus({
    required String shopId,
    required String orderId,
    required String status,
    String? note,
  });
}

class OrdersRemoteDataSourceImpl implements OrdersRemoteDataSource {
  OrdersRemoteDataSourceImpl(this._apiClient);

  static const int _defaultListLimit = 100;

  final ApiClient _apiClient;

  @override
  Future<List<OrderListItemModel>> fetchOrders({
    required String shopId,
    int limit = _defaultListLimit,
  }) async {
    final payload = await _apiClient.getList(
      '/shops/$shopId/orders',
      queryParameters: <String, dynamic>{'limit': limit},
    );

    return payload
        .map(OrderListItemModel.fromJson)
        .where((order) => order.id.isNotEmpty)
        .toList(growable: false);
  }

  @override
  Future<OrderListItemModel> updateOrderStatus({
    required String shopId,
    required String orderId,
    required String status,
    String? note,
  }) async {
    final payload = await _apiClient.postMap(
      '/shops/$shopId/orders/$orderId/status',
      data: <String, dynamic>{
        'status': status,
        if ((note ?? '').trim().isNotEmpty) 'note': note!.trim(),
      },
    );

    return OrderListItemModel.fromJson(payload);
  }
}
