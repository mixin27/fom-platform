import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';

import '../../../orders/domain/entities/order_list_item.dart';
import '../../domain/entities/customer_draft.dart';
import '../../domain/entities/customer_list_item.dart';
import '../../domain/repositories/customers_repository.dart';
import '../datasources/customers_local_data_source.dart';
import '../datasources/customers_remote_data_source.dart';

class CustomersRepositoryImpl with LoggerMixin implements CustomersRepository {
  CustomersRepositoryImpl(
    this._localDataSource,
    this._remoteDataSource, {
    AppLogger? logger,
  }) : _logger = logger ?? AppLogger(enabled: false);

  final CustomersLocalDataSource _localDataSource;
  final CustomersRemoteDataSource _remoteDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('CustomersRepository');

  @override
  Future<Result<void>> refreshCustomers({required String shopId}) async {
    try {
      final remoteCustomers = await _remoteDataSource.fetchCustomers(
        shopId: shopId,
      );

      await _localDataSource.replaceCustomersForShop(
        shopId: shopId,
        customers: remoteCustomers,
        syncedAt: DateTime.now(),
      );

      log.info(
        "Customers cache refreshed: shop=$shopId, count=${remoteCustomers.length}",
      );
      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error(
        'Failed to refresh customers',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<void>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<void>> refreshCustomerDetail({
    required String shopId,
    required String customerId,
  }) async {
    try {
      final detail = await _remoteDataSource.fetchCustomerDetail(
        shopId: shopId,
        customerId: customerId,
      );

      await _localDataSource.upsertCustomer(
        customer: detail,
        syncedAt: DateTime.now(),
      );

      log.info("Customer detail refreshed: shop=$shopId, customer=$customerId");
      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error(
        'Failed to refresh customer detail',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<void>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<CustomerListItem>> createCustomer({
    required String shopId,
    required CustomerDraft draft,
  }) async {
    try {
      final customer = await _remoteDataSource.createCustomer(
        shopId: shopId,
        draft: draft,
      );

      await _localDataSource.upsertCustomer(
        customer: customer,
        syncedAt: DateTime.now(),
      );

      log.info("Customer created: shop=$shopId, customer=${customer.id}");
      return Result<CustomerListItem>.success(customer);
    } catch (error, stackTrace) {
      log.error(
        'Failed to create customer',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<CustomerListItem>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<CustomerListItem>> updateCustomer({
    required String shopId,
    required String customerId,
    required CustomerDraft draft,
  }) async {
    try {
      final customer = await _remoteDataSource.updateCustomer(
        shopId: shopId,
        customerId: customerId,
        draft: draft,
      );

      await _localDataSource.upsertCustomer(
        customer: customer,
        syncedAt: DateTime.now(),
      );

      log.info("Customer updated: shop=$shopId, customer=$customerId");
      return Result<CustomerListItem>.success(customer);
    } catch (error, stackTrace) {
      log.error(
        'Failed to update customer',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<CustomerListItem>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<List<OrderListItem>>> fetchCustomerOrders({
    required String shopId,
    required String customerId,
  }) async {
    try {
      final orders = await _remoteDataSource.fetchCustomerOrders(
        shopId: shopId,
        customerId: customerId,
      );

      log.info(
        'Customer orders fetched: shop=$shopId, customer=$customerId, count=${orders.length}',
      );
      return Result<List<OrderListItem>>.success(orders);
    } catch (error, stackTrace) {
      log.error(
        'Failed to fetch customer orders',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<List<OrderListItem>>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<void>> deleteCustomer({
    required String shopId,
    required String customerId,
  }) async {
    try {
      await _remoteDataSource.deleteCustomer(
        shopId: shopId,
        customerId: customerId,
      );

      await _localDataSource.deleteCustomer(
        shopId: shopId,
        customerId: customerId,
      );

      log.info('Customer deleted: shop=$shopId, customer=$customerId');
      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error(
        'Failed to delete customer',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<void>.failure(FailureMapper.from(error));
    }
  }

  @override
  Stream<CustomerListItem?> watchCustomer({
    required String shopId,
    required String customerId,
  }) {
    return _localDataSource.watchCustomer(
      shopId: shopId,
      customerId: customerId,
    );
  }

  @override
  Stream<List<CustomerListItem>> watchCustomers({required String shopId}) {
    return _localDataSource.watchCustomers(shopId: shopId);
  }
}
