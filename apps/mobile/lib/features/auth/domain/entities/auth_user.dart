import 'package:equatable/equatable.dart';

import 'auth_access.dart';

class AuthUser extends Equatable {
  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.locale,
    required this.platformAccess,
    required this.shopAccesses,
  });

  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String locale;
  final AuthPlatformAccess? platformAccess;
  final List<AuthShopAccess> shopAccesses;

  @override
  List<Object?> get props => <Object?>[
    id,
    name,
    email,
    phone,
    locale,
    platformAccess,
    shopAccesses,
  ];
}
