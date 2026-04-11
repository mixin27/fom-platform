import "package:equatable/equatable.dart";

import "order_status.dart";

class OrderStatusHistoryEvent extends Equatable {
  const OrderStatusHistoryEvent({
    required this.id,
    required this.toStatus,
    required this.changedAt,
    this.fromStatus,
    this.note,
    this.changedByName,
  });

  final String id;
  final OrderStatus? fromStatus;
  final OrderStatus toStatus;
  final DateTime changedAt;
  final String? note;
  final String? changedByName;

  @override
  List<Object?> get props => [
    id,
    fromStatus,
    toStatus,
    changedAt,
    note,
    changedByName,
  ];
}
