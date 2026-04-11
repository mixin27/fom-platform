import 'package:drift/drift.dart';

class OrderCacheRecords extends Table {
  TextColumn get id => text()();

  TextColumn get shopId => text()();

  TextColumn get orderNo => text()();

  TextColumn get status => text()();

  IntColumn get totalPrice => integer()();

  TextColumn get currency => text().withDefault(const Constant('MMK'))();

  TextColumn get customerName => text()();

  TextColumn get customerPhone => text()();

  TextColumn get customerTownship => text().nullable()();

  TextColumn get customerAddress => text().nullable()();

  TextColumn get productSummary => text()();

  IntColumn get itemCount => integer().withDefault(const Constant(0))();

  TextColumn get itemsJson => text().withDefault(const Constant('[]'))();

  DateTimeColumn get createdAt => dateTime()();

  DateTimeColumn get updatedAt => dateTime()();

  DateTimeColumn get syncedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
