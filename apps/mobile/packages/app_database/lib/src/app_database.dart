import "package:app_database/src/daos/store_dao.dart";
import "package:app_database/src/tables/store_records.dart";
import "package:drift/drift.dart";
import "package:drift_flutter/drift_flutter.dart";
import "package:path_provider/path_provider.dart";

part "app_database.g.dart";

/// Represents App Database.
@DriftDatabase(tables: [StoreRecords], daos: [StoreDao])
class AppDatabase extends _$AppDatabase {
  AppDatabase({QueryExecutor? e}) : super(e ?? _openConnection());

  @override
  int get schemaVersion => 1;
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
