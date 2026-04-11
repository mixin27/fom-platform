import 'package:app_network/app_network.dart';

import "../../domain/entities/order_entry_draft.dart";
import "../models/order_details_model.dart";
import "../models/order_entry_draft_model.dart";
import '../models/order_list_item_model.dart';
import "../models/parsed_order_message_model.dart";

abstract class OrdersRemoteDataSource {
  Future<List<OrderListItemModel>> fetchOrders({
    required String shopId,
    int limit,
  });

  Future<OrderListItemModel> createOrder({
    required String shopId,
    required OrderEntryDraft draft,
  });

  Future<ParsedOrderMessageModel> parseOrderMessage({
    required String shopId,
    required String message,
  });

  Future<OrderListItemModel> updateOrderStatus({
    required String shopId,
    required String orderId,
    required String status,
    String? note,
  });

  Future<OrderDetailsModel> fetchOrderDetails({
    required String shopId,
    required String orderId,
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
  Future<OrderListItemModel> createOrder({
    required String shopId,
    required OrderEntryDraft draft,
  }) async {
    final payload = await _apiClient.postMap(
      "/shops/$shopId/orders",
      data: OrderEntryDraftModel.fromEntity(draft).toCreatePayload(),
    );

    return OrderListItemModel.fromJson(payload);
  }

  @override
  Future<ParsedOrderMessageModel> parseOrderMessage({
    required String shopId,
    required String message,
  }) async {
    final payload = await _apiClient.postMap(
      "/shops/$shopId/orders/parse-message",
      data: <String, dynamic>{"message": message.trim()},
    );

    return ParsedOrderMessageModel.fromJson(payload);
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

  @override
  Future<OrderDetailsModel> fetchOrderDetails({
    required String shopId,
    required String orderId,
  }) async {
    final payload = await _apiClient.getMap("/shops/$shopId/orders/$orderId");
    return OrderDetailsModel.fromJson(payload);
  }
}
