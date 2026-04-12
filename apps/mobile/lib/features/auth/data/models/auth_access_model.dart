import '../../domain/entities/auth_access.dart';

class AuthPlatformAccessModel extends AuthPlatformAccess {
  const AuthPlatformAccessModel({
    required super.role,
    required super.roles,
    required super.permissions,
  });

  factory AuthPlatformAccessModel.fromJson(Map<String, dynamic> json) {
    return AuthPlatformAccessModel(
      role: _asNullableString(json['role']),
      roles: _asStringList(json['roles']),
      permissions: _asStringList(json['permissions']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'role': role,
      'roles': roles,
      'permissions': permissions,
    };
  }
}

class AuthShopAccessModel extends AuthShopAccess {
  const AuthShopAccessModel({
    required super.shopId,
    required super.shopName,
    required super.timezone,
    required super.role,
    required super.roles,
    required super.permissions,
  });

  factory AuthShopAccessModel.fromJson(Map<String, dynamic> json) {
    final membership = _asNullableMap(json['membership']);
    final source = membership ?? json;

    return AuthShopAccessModel(
      shopId: _asString(json['shop_id'] ?? json['id'] ?? source['shop_id']),
      shopName: _asNullableString(json['name']) ?? 'Shop',
      timezone: _asNullableString(json['timezone']) ?? 'Asia/Yangon',
      role: _asNullableString(source['role']),
      roles: _asStringList(source['roles']),
      permissions: _asStringList(source['permissions']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'shop_id': shopId,
      'name': shopName,
      'timezone': timezone,
      'role': role,
      'roles': roles,
      'permissions': permissions,
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

List<String> _asStringList(dynamic value) {
  if (value is List) {
    return value
        .map((entry) {
          if (entry is String) {
            return entry.trim();
          }

          if (entry is Map) {
            final map = Map<String, dynamic>.from(entry);
            return _asNullableString(map['code']) ??
                _asNullableString(map['name']) ??
                '';
          }

          return entry.toString().trim();
        })
        .where((entry) => entry.isNotEmpty)
        .toList(growable: false);
  }

  return const <String>[];
}
