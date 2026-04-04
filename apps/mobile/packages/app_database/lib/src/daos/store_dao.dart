import "package:app_database/src/app_database.dart";
import "package:app_database/src/tables/store_records.dart";
import "package:drift/drift.dart";

part "store_dao.g.dart";

/// Represents Store Dao.
@DriftAccessor(tables: [StoreRecords])
class StoreDao extends DatabaseAccessor<AppDatabase> with _$StoreDaoMixin {
  StoreDao(super.db);

  Stream<List<StoreRecord>> watchAllStores() {
    return (select(
      storeRecords,
    )..orderBy([(t) => OrderingTerm.asc(t.name)])).watch();
  }

  Stream<List<StoreRecord>> watchStoresByOrganization(String organizationId) {
    return (select(storeRecords)
          ..where((t) => t.organizationId.equals(organizationId))
          ..orderBy([(t) => OrderingTerm.asc(t.name)]))
        .watch();
  }

  Future<List<StoreRecord>> getAllStores() {
    return (select(
      storeRecords,
    )..orderBy([(t) => OrderingTerm.asc(t.name)])).get();
  }

  Future<List<StoreRecord>> getStoresByOrganization(String organizationId) {
    return (select(storeRecords)
          ..where((t) => t.organizationId.equals(organizationId))
          ..orderBy([(t) => OrderingTerm.asc(t.name)]))
        .get();
  }

  Future<StoreRecord?> getActiveStore() {
    return (select(
      storeRecords,
    )..where((t) => t.isActive.equals(true))).getSingleOrNull();
  }

  Future<void> upsertStore(StoreRecordsCompanion store) {
    return into(storeRecords).insertOnConflictUpdate(store);
  }

  Future<void> upsertStores(List<StoreRecordsCompanion> stores) {
    return batch(
      (batch) => batch.insertAllOnConflictUpdate(storeRecords, stores),
    );
  }

  Future<void> setActiveStore(String storeId) async {
    await transaction(() async {
      await (update(storeRecords)..where((t) => t.isActive.equals(true))).write(
        const StoreRecordsCompanion(isActive: Value(false)),
      );

      await (update(storeRecords)..where((t) => t.id.equals(storeId))).write(
        const StoreRecordsCompanion(isActive: Value(true)),
      );
    });
  }
}
