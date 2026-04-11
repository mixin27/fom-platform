import "package:equatable/equatable.dart";

import "order_entry_draft.dart";

class ParsedOrderMessage extends Equatable {
  const ParsedOrderMessage({
    required this.suggestedOrder,
    required this.subtotal,
    required this.totalPrice,
    required this.isReadyToCreate,
    required this.confidence,
    required this.matchedFields,
    required this.warnings,
    required this.unparsedLines,
    this.customerMatch,
  });

  final OrderEntryDraft suggestedOrder;
  final int subtotal;
  final int totalPrice;
  final bool isReadyToCreate;
  final double confidence;
  final List<String> matchedFields;
  final List<String> warnings;
  final List<String> unparsedLines;
  final ParsedOrderCustomerMatch? customerMatch;

  @override
  List<Object?> get props => [
    suggestedOrder,
    subtotal,
    totalPrice,
    isReadyToCreate,
    confidence,
    matchedFields,
    warnings,
    unparsedLines,
    customerMatch,
  ];
}

class ParsedOrderCustomerMatch extends Equatable {
  const ParsedOrderCustomerMatch({
    required this.id,
    required this.shopId,
    required this.name,
    required this.phone,
    required this.createdAt,
    this.township,
    this.address,
    this.notes,
  });

  final String id;
  final String shopId;
  final String name;
  final String phone;
  final DateTime createdAt;
  final String? township;
  final String? address;
  final String? notes;

  @override
  List<Object?> get props => [
    id,
    shopId,
    name,
    phone,
    createdAt,
    township,
    address,
    notes,
  ];
}
