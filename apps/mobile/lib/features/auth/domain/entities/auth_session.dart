import 'package:equatable/equatable.dart';

import 'auth_user.dart';

class AuthSession extends Equatable {
  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
    required this.accessExpiresAt,
    required this.refreshExpiresAt,
  });

  final AuthUser user;
  final String accessToken;
  final String refreshToken;
  final DateTime? accessExpiresAt;
  final DateTime? refreshExpiresAt;

  @override
  List<Object?> get props => <Object?>[
    user,
    accessToken,
    refreshToken,
    accessExpiresAt,
    refreshExpiresAt,
  ];
}
