import "package:app_database/src/app_database.dart";
import "package:app_database/src/tables/customer_cache_records.dart";
import "package:drift/drift.dart";

part "customer_cache_dao.g.dart";

@DriftAccessor(tables: [CustomerCacheRecords])
class CustomerCacheDao extends DatabaseAccessor<AppDatabase>
    with _$CustomerCacheDaoMixin {
  CustomerCacheDao(super.db);

  Stream<List<CustomerCacheRecord>> watchCustomersByShop(String shopId) {
    return (select(customerCacheRecords)
          ..where((table) => table.shopId.equals(shopId))
          ..orderBy([(table) => OrderingTerm.asc(table.name)]))
        .watch();
  }

  Stream<CustomerCacheRecord?> watchCustomerById({
    required String shopId,
    required String customerId,
  }) {
    return (select(customerCacheRecords)..where(
          (table) => table.shopId.equals(shopId) & table.id.equals(customerId),
        ))
        .watchSingleOrNull();
  }

  Future<List<CustomerCacheRecord>> getCustomersByShop(String shopId) {
    return (select(
      customerCacheRecords,
    )..where((table) => table.shopId.equals(shopId))).get();
  }

  Future<void> replaceCustomersForShop({
    required String shopId,
    required List<CustomerCacheRecordsCompanion> customers,
  }) async {
    await transaction(() async {
      await (delete(
        customerCacheRecords,
      )..where((table) => table.shopId.equals(shopId))).go();

      if (customers.isEmpty) {
        return;
      }

      await batch((batch) {
        batch.insertAllOnConflictUpdate(customerCacheRecords, customers);
      });
    });
  }

  Future<void> upsertCustomer(CustomerCacheRecordsCompanion customer) async {
    await into(customerCacheRecords).insertOnConflictUpdate(customer);
  }

  Future<void> clearCustomersForShop(String shopId) async {
    await (delete(
      customerCacheRecords,
    )..where((table) => table.shopId.equals(shopId))).go();
  }
}
