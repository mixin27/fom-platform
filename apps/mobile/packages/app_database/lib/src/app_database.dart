import "package:app_database/src/daos/order_cache_dao.dart";
import "package:app_database/src/daos/report_cache_dao.dart";
import "package:app_database/src/daos/store_dao.dart";
import "package:app_database/src/daos/customer_cache_dao.dart";
import "package:app_database/src/tables/customer_cache_records.dart";
import "package:app_database/src/tables/order_cache_records.dart";
import "package:app_database/src/tables/report_cache_records.dart";
import "package:app_database/src/tables/store_records.dart";
import "package:drift/drift.dart";
import "package:drift_flutter/drift_flutter.dart";
import "package:path_provider/path_provider.dart";

part "app_database.g.dart";

/// Represents App Database.
@DriftDatabase(
  tables: [
    StoreRecords,
    OrderCacheRecords,
    CustomerCacheRecords,
    ReportCacheRecords,
  ],
  daos: [StoreDao, OrderCacheDao, CustomerCacheDao, ReportCacheDao],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase({QueryExecutor? e}) : super(e ?? _openConnection());

  @override
  int get schemaVersion => 4;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator migrator) async {
        await migrator.createAll();
      },
      onUpgrade: (Migrator migrator, int from, int to) async {
        if (from < 2) {
          await migrator.createTable(orderCacheRecords);
        }
        if (from < 3) {
          await migrator.createTable(customerCacheRecords);
        }
        if (from < 4) {
          await migrator.createTable(reportCacheRecords);
        }
      },
    );
  }
}

// `.sqlite` extension will be added by drift_flutter
const String _databaseName = "fom_db";

QueryExecutor _openConnection() {
  return driftDatabase(
    name: _databaseName,
    native: const DriftNativeOptions(
      databaseDirectory: getApplicationSupportDirectory,
    ),
  );
}
