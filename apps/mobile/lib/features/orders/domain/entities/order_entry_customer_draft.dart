import "package:equatable/equatable.dart";

class OrderEntryCustomerDraft extends Equatable {
  const OrderEntryCustomerDraft({
    required this.name,
    required this.phone,
    this.township,
    this.address,
    this.customerId,
  });

  final String name;
  final String phone;
  final String? township;
  final String? address;
  final String? customerId;

  @override
  List<Object?> get props => [name, phone, township, address, customerId];
}
