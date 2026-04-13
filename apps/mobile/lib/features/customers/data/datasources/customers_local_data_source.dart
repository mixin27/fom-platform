import 'package:app_database/app_database.dart';

import '../models/customer_list_item_model.dart';

abstract class CustomersLocalDataSource {
  Stream<List<CustomerListItemModel>> watchCustomers({required String shopId});

  Stream<CustomerListItemModel?> watchCustomer({
    required String shopId,
    required String customerId,
  });

  Future<void> replaceCustomersForShop({
    required String shopId,
    required List<CustomerListItemModel> customers,
    required DateTime syncedAt,
  });

  Future<void> upsertCustomer({
    required CustomerListItemModel customer,
    required DateTime syncedAt,
  });

  Future<void> deleteCustomer({
    required String shopId,
    required String customerId,
  });
}

class CustomersLocalDataSourceImpl implements CustomersLocalDataSource {
  CustomersLocalDataSourceImpl(this._customerCacheDao);

  final CustomerCacheDao _customerCacheDao;

  @override
  Stream<List<CustomerListItemModel>> watchCustomers({required String shopId}) {
    return _customerCacheDao
        .watchCustomersByShop(shopId)
        .map(
          (rows) => rows
              .map(CustomerListItemModel.fromCacheRecord)
              .toList(growable: false),
        );
  }

  @override
  Stream<CustomerListItemModel?> watchCustomer({
    required String shopId,
    required String customerId,
  }) {
    return _customerCacheDao
        .watchCustomerById(shopId: shopId, customerId: customerId)
        .map(
          (row) =>
              row == null ? null : CustomerListItemModel.fromCacheRecord(row),
        );
  }

  @override
  Future<void> replaceCustomersForShop({
    required String shopId,
    required List<CustomerListItemModel> customers,
    required DateTime syncedAt,
  }) async {
    final existingRows = await _customerCacheDao.getCustomersByShop(shopId);
    final existingMap = <String, CustomerListItemModel>{
      for (final row in existingRows)
        row.id: CustomerListItemModel.fromCacheRecord(row),
    };

    final companions = customers
        .map((customer) {
          final fallback = existingMap[customer.id];
          final merged = fallback == null
              ? customer
              : customer.withFallbackRecentOrders(fallback);

          return merged.toCompanion(syncedAt: syncedAt);
        })
        .toList(growable: false);

    await _customerCacheDao.replaceCustomersForShop(
      shopId: shopId,
      customers: companions,
    );
  }

  @override
  Future<void> upsertCustomer({
    required CustomerListItemModel customer,
    required DateTime syncedAt,
  }) {
    return _customerCacheDao.upsertCustomer(
      customer.toCompanion(syncedAt: syncedAt),
    );
  }

  @override
  Future<void> deleteCustomer({
    required String shopId,
    required String customerId,
  }) {
    return _customerCacheDao.deleteCustomerById(
      shopId: shopId,
      customerId: customerId,
    );
  }
}
