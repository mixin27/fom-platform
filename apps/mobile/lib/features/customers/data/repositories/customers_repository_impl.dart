import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';

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
