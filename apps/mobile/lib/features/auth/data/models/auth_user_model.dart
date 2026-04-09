import '../../domain/entities/auth_user.dart';
import 'auth_access_model.dart';

class AuthUserModel extends AuthUser {
  const AuthUserModel({
    required super.id,
    required super.name,
    required super.email,
    required super.phone,
    required super.locale,
    required super.platformAccess,
    required super.shopAccesses,
  });

  factory AuthUserModel.fromJson(Map<String, dynamic> json) {
    final rawPlatform = _asNullableMap(
      json['platform_access'] ?? json['platform'],
    );
    final rawShops = _asMapList(json['shops']);

    return AuthUserModel(
      id: _asString(json['id']),
      name: _asNullableString(json['name']) ?? 'Unknown User',
      email: _asNullableString(json['email']),
      phone: _asNullableString(json['phone']),
      locale: _asNullableString(json['locale']) ?? 'my',
      platformAccess: rawPlatform == null
          ? null
          : AuthPlatformAccessModel.fromJson(rawPlatform),
      shopAccesses: rawShops
          .map(AuthShopAccessModel.fromJson)
          .where((shop) => shop.shopId.isNotEmpty)
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'locale': locale,
      'platform_access': (platformAccess as AuthPlatformAccessModel?)?.toJson(),
      'shops': shopAccesses
          .map((shop) => (shop as AuthShopAccessModel).toJson())
          .toList(growable: false),
    };
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

List<Map<String, dynamic>> _asMapList(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((map) => Map<String, dynamic>.from(map))
        .toList(growable: false);
  }

  return const <Map<String, dynamic>>[];
}

String _asString(dynamic value) {
  if (value == null) {
    return '';
  }

  return value.toString();
}

String? _asNullableString(dynamic value) {
  final normalized = _asString(value).trim();
  if (normalized.isEmpty) {
    return null;
  }

  return normalized;
}
