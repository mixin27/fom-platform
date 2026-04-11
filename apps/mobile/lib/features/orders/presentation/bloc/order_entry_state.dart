import "package:equatable/equatable.dart";

import "../../domain/entities/order_list_item.dart";
import "../../domain/entities/parsed_order_message.dart";

enum OrderEntryStatus { initial, loading, ready, parsing, submitting, success }

class OrderEntryState extends Equatable {
  const OrderEntryState({
    this.status = OrderEntryStatus.initial,
    this.shopId,
    this.shopName = "My Shop",
    this.parsedOrderMessage,
    this.createdOrder,
    this.errorMessage,
  });

  final OrderEntryStatus status;
  final String? shopId;
  final String shopName;
  final ParsedOrderMessage? parsedOrderMessage;
  final OrderListItem? createdOrder;
  final String? errorMessage;

  bool get hasShop => (shopId ?? "").trim().isNotEmpty;

  bool get isBusy =>
      status == OrderEntryStatus.parsing ||
      status == OrderEntryStatus.submitting;

  bool get isParsing => status == OrderEntryStatus.parsing;

  bool get isSubmitting => status == OrderEntryStatus.submitting;

  bool get isSuccess =>
      status == OrderEntryStatus.success && createdOrder != null;

  bool get hasParsedMessage => parsedOrderMessage != null;

  bool get hasError => (errorMessage ?? "").trim().isNotEmpty;

  OrderEntryState copyWith({
    OrderEntryStatus? status,
    String? shopId,
    String? shopName,
    ParsedOrderMessage? parsedOrderMessage,
    bool clearParsedOrderMessage = false,
    OrderListItem? createdOrder,
    bool clearCreatedOrder = false,
    String? errorMessage,
    bool clearError = false,
  }) {
    return OrderEntryState(
      status: status ?? this.status,
      shopId: shopId ?? this.shopId,
      shopName: shopName ?? this.shopName,
      parsedOrderMessage: clearParsedOrderMessage
          ? null
          : (parsedOrderMessage ?? this.parsedOrderMessage),
      createdOrder: clearCreatedOrder
          ? null
          : (createdOrder ?? this.createdOrder),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => [
    status,
    shopId,
    shopName,
    parsedOrderMessage,
    createdOrder,
    errorMessage,
  ];
}
