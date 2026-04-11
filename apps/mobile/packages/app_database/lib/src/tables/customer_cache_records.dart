import "package:drift/drift.dart";

class CustomerCacheRecords extends Table {
  TextColumn get id => text()();

  TextColumn get shopId => text()();

  TextColumn get name => text()();

  TextColumn get phone => text()();

  TextColumn get township => text().nullable()();

  TextColumn get address => text().nullable()();

  TextColumn get notes => text().nullable()();

  TextColumn get avatarUrl => text().nullable()();

  DateTimeColumn get createdAt => dateTime()();

  IntColumn get totalOrders => integer().withDefault(const Constant(0))();

  IntColumn get totalSpent => integer().withDefault(const Constant(0))();

  DateTimeColumn get lastOrderAt => dateTime().nullable()();

  IntColumn get deliveredRate => integer().withDefault(const Constant(0))();

  BoolColumn get isVip => boolean().withDefault(const Constant(false))();

  BoolColumn get isNewThisWeek =>
      boolean().withDefault(const Constant(false))();

  IntColumn get largestOrderTotal => integer().withDefault(const Constant(0))();

  TextColumn get favouriteItem => text().nullable()();

  TextColumn get recentOrdersJson => text().withDefault(const Constant("[]"))();

  BoolColumn get hasRecentOrders =>
      boolean().withDefault(const Constant(false))();

  DateTimeColumn get syncedAt => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
