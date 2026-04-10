import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';

import '../../domain/entities/order_list_item.dart';
import '../../domain/entities/order_status.dart';
import '../../domain/repositories/orders_repository.dart';
import '../datasources/orders_local_data_source.dart';
import '../datasources/orders_remote_data_source.dart';

class OrdersRepositoryImpl with LoggerMixin implements OrdersRepository {
  OrdersRepositoryImpl(
    this._localDataSource,
    this._remoteDataSource, {
    AppLogger? logger,
  }) : _logger = logger ?? AppLogger(enabled: false);

  final OrdersLocalDataSource _localDataSource;
  final OrdersRemoteDataSource _remoteDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('OrdersRepository');

  @override
  Future<Result<void>> refreshOrders({required String shopId}) async {
    try {
      final remoteOrders = await _remoteDataSource.fetchOrders(shopId: shopId);

      await _localDataSource.replaceOrdersForShop(
        shopId: shopId,
        orders: remoteOrders,
        syncedAt: DateTime.now(),
      );

      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error(
        'Failed to refresh orders',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<void>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<void>> updateOrderStatus({
    required String shopId,
    required String orderId,
    required OrderStatus status,
    String? note,
  }) async {
    try {
      final updated = await _remoteDataSource.updateOrderStatus(
        shopId: shopId,
        orderId: orderId,
        status: status.apiValue,
        note: note,
      );

      await _localDataSource.upsertOrder(
        order: updated,
        syncedAt: DateTime.now(),
      );

      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error(
        'Failed to update order status',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<void>.failure(FailureMapper.from(error));
    }
  }

  @override
  Stream<List<OrderListItem>> watchOrders({required String shopId}) {
    return _localDataSource.watchOrders(shopId: shopId);
  }
}
