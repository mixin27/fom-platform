import "package:drift/drift.dart";

/// Represents Store Records.
class StoreRecords extends Table {
  TextColumn get id => text()();

  TextColumn get organizationId => text()();

  TextColumn get name => text()();

  TextColumn get address => text()();

  RealColumn get latitude => real().withDefault(const Constant(0.0))();

  RealColumn get longitude => real().withDefault(const Constant(0.0))();

  TextColumn get status => text()();

  TextColumn get photoUrl => text().nullable()();

  DateTimeColumn get createdAt => dateTime()();

  IntColumn get createdBy => integer()();

  DateTimeColumn get updatedAt => dateTime().nullable()();

  IntColumn get updatedBy => integer().nullable()();

  BoolColumn get isActive => boolean().withDefault(const Constant(false))();

  @override
  Set<Column<Object>> get primaryKey => {id};
}
