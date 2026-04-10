import 'package:app_database/src/app_database.dart';
import 'package:app_database/src/tables/order_cache_records.dart';
import 'package:drift/drift.dart';

part 'order_cache_dao.g.dart';

@DriftAccessor(tables: [OrderCacheRecords])
class OrderCacheDao extends DatabaseAccessor<AppDatabase>
    with _$OrderCacheDaoMixin {
  OrderCacheDao(super.db);

  Stream<List<OrderCacheRecord>> watchOrdersByShop(String shopId) {
    return (select(orderCacheRecords)
          ..where((table) => table.shopId.equals(shopId))
          ..orderBy([
            (table) => OrderingTerm.desc(table.createdAt),
            (table) => OrderingTerm.desc(table.updatedAt),
          ]))
        .watch();
  }

  Future<void> replaceOrdersForShop({
    required String shopId,
    required List<OrderCacheRecordsCompanion> orders,
  }) async {
    await transaction(() async {
      await (delete(
        orderCacheRecords,
      )..where((t) => t.shopId.equals(shopId))).go();

      if (orders.isEmpty) {
        return;
      }

      await batch((batch) {
        batch.insertAllOnConflictUpdate(orderCacheRecords, orders);
      });
    });
  }

  Future<void> upsertOrder(OrderCacheRecordsCompanion order) async {
    await into(orderCacheRecords).insertOnConflictUpdate(order);
  }

  Future<void> clearOrdersForShop(String shopId) async {
    await (delete(
      orderCacheRecords,
    )..where((t) => t.shopId.equals(shopId))).go();
  }
}
