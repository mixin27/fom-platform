import "package:equatable/equatable.dart";

class OrderEntryItemDraft extends Equatable {
  const OrderEntryItemDraft({
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    this.productId,
  });

  final String productName;
  final int quantity;
  final int unitPrice;
  final String? productId;

  int get lineTotal => quantity * unitPrice;

  @override
  List<Object?> get props => [productName, quantity, unitPrice, productId];
}
