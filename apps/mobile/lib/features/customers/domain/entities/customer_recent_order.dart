import 'package:equatable/equatable.dart';

class CustomerRecentOrder extends Equatable {
  const CustomerRecentOrder({
    required this.id,
    required this.orderNo,
    required this.status,
    required this.totalPrice,
    required this.createdAt,
    required this.productName,
  });

  final String id;
  final String orderNo;
  final String status;
  final int totalPrice;
  final DateTime createdAt;
  final String productName;

  bool get isDelivered => status.toLowerCase() == 'delivered';

  String get statusLabel {
    final normalized = status.trim();
    if (normalized.isEmpty) {
      return 'UNKNOWN';
    }

    return normalized.replaceAll('_', ' ').toUpperCase();
  }

  @override
  List<Object?> get props => [
    id,
    orderNo,
    status,
    totalPrice,
    createdAt,
    productName,
  ];
}
