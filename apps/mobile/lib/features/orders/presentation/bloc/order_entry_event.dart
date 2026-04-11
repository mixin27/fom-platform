import "package:equatable/equatable.dart";

import "../../domain/entities/order_entry_draft.dart";

sealed class OrderEntryEvent extends Equatable {
  const OrderEntryEvent();

  @override
  List<Object?> get props => const [];
}

class OrderEntryStarted extends OrderEntryEvent {
  const OrderEntryStarted({required this.shopId, required this.shopName});

  final String shopId;
  final String shopName;

  @override
  List<Object?> get props => [shopId, shopName];
}

class OrderEntryParseMessageRequested extends OrderEntryEvent {
  const OrderEntryParseMessageRequested({required this.message});

  final String message;

  @override
  List<Object?> get props => [message];
}

class OrderEntrySaveRequested extends OrderEntryEvent {
  const OrderEntrySaveRequested({required this.draft});

  final OrderEntryDraft draft;

  @override
  List<Object?> get props => [draft];
}

class OrderEntryCleared extends OrderEntryEvent {
  const OrderEntryCleared();
}

class OrderEntryErrorDismissed extends OrderEntryEvent {
  const OrderEntryErrorDismissed();
}

class OrderEntrySuccessDismissed extends OrderEntryEvent {
  const OrderEntrySuccessDismissed();
}
