import "package:drift/drift.dart";

class ReportCacheRecords extends Table {
  TextColumn get id => text()();

  TextColumn get shopId => text()();

  TextColumn get periodType => text()();

  TextColumn get periodKey => text()();

  TextColumn get payloadJson => text()();

  DateTimeColumn get syncedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
