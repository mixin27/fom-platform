import 'package:app_network/app_network.dart';

import '../../domain/entities/auth_session.dart';
import 'auth_user_model.dart';

class AuthSessionModel extends AuthSession {
  const AuthSessionModel({
    required super.user,
    required super.accessToken,
    required super.refreshToken,
    required super.accessExpiresAt,
    required super.refreshExpiresAt,
  });

  factory AuthSessionModel.fromJson(Map<String, dynamic> json) {
    final rawUser = _asNullableMap(json['user']) ?? json;

    return AuthSessionModel(
      user: AuthUserModel.fromJson(rawUser),
      accessToken: _asString(json['access_token'] ?? json['token']),
      refreshToken: _asString(json['refresh_token']),
      accessExpiresAt: _asDateTime(json['expires_at']),
      refreshExpiresAt: _asDateTime(json['refresh_expires_at']),
    );
  }

  factory AuthSessionModel.fromStorage({
    required AuthUserModel user,
    required AuthTokens tokens,
  }) {
    return AuthSessionModel(
      user: user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessExpiresAt: null,
      refreshExpiresAt: null,
    );
  }

  AuthTokens toTokens() {
    return AuthTokens(accessToken: accessToken, refreshToken: refreshToken);
  }
}

Map<String, dynamic>? _asNullableMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }

  return null;
}

String _asString(dynamic value) {
  if (value == null) {
    return '';
  }

  return value.toString();
}

DateTime? _asDateTime(dynamic value) {
  final raw = _asString(value).trim();
  if (raw.isEmpty) {
    return null;
  }

  return DateTime.tryParse(raw);
}
