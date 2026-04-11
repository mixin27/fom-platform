import 'package:equatable/equatable.dart';

import '../../domain/entities/customer_list_item.dart';

enum CustomerProfileStatus { initial, loading, ready, error }

class CustomerProfileState extends Equatable {
  const CustomerProfileState({
    this.status = CustomerProfileStatus.initial,
    this.shopId,
    this.shopName,
    this.customerId,
    this.customer,
    this.isRefreshing = false,
    this.errorMessage,
    this.lastRefreshedAt,
  });

  final CustomerProfileStatus status;
  final String? shopId;
  final String? shopName;
  final String? customerId;
  final CustomerListItem? customer;
  final bool isRefreshing;
  final String? errorMessage;
  final DateTime? lastRefreshedAt;

  bool get hasShop => (shopId ?? '').trim().isNotEmpty;

  bool get hasCustomer => customer != null;

  CustomerProfileState copyWith({
    CustomerProfileStatus? status,
    String? shopId,
    String? shopName,
    String? customerId,
    CustomerListItem? customer,
    bool clearCustomer = false,
    bool? isRefreshing,
    String? errorMessage,
    bool clearError = false,
    DateTime? lastRefreshedAt,
  }) {
    return CustomerProfileState(
      status: status ?? this.status,
      shopId: shopId ?? this.shopId,
      shopName: shopName ?? this.shopName,
      customerId: customerId ?? this.customerId,
      customer: clearCustomer ? null : (customer ?? this.customer),
      isRefreshing: isRefreshing ?? this.isRefreshing,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastRefreshedAt: lastRefreshedAt ?? this.lastRefreshedAt,
    );
  }

  @override
  List<Object?> get props => [
    status,
    shopId,
    shopName,
    customerId,
    customer,
    isRefreshing,
    errorMessage,
    lastRefreshedAt,
  ];
}
