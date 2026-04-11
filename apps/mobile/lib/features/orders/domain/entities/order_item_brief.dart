import 'package:equatable/equatable.dart';

class OrderItemBrief extends Equatable {
  const OrderItemBrief({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
  });

  final String id;
  final String productName;
  final int quantity;
  final int unitPrice;
  final int lineTotal;

  @override
  List<Object?> get props => [id, productName, quantity, unitPrice, lineTotal];
}
