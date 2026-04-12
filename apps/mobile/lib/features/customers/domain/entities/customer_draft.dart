import 'package:equatable/equatable.dart';

class CustomerDraft extends Equatable {
  const CustomerDraft({
    required this.name,
    required this.phone,
    this.township,
    this.address,
    this.notes,
  });

  final String name;
  final String phone;
  final String? township;
  final String? address;
  final String? notes;

  @override
  List<Object?> get props => <Object?>[name, phone, township, address, notes];
}
