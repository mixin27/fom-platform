import 'package:equatable/equatable.dart';

class AuthPlatformAccess extends Equatable {
  const AuthPlatformAccess({
    required this.role,
    required this.roles,
    required this.permissions,
  });

  final String? role;
  final List<String> roles;
  final List<String> permissions;

  @override
  List<Object?> get props => <Object?>[role, roles, permissions];
}

class AuthShopAccess extends Equatable {
  const AuthShopAccess({
    required this.shopId,
    required this.role,
    required this.roles,
    required this.permissions,
  });

  final String shopId;
  final String? role;
  final List<String> roles;
  final List<String> permissions;

  @override
  List<Object?> get props => <Object?>[shopId, role, roles, permissions];
}
