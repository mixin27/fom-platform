import '../../domain/entities/settings_shop_profile.dart';

class SettingsShopProfileModel extends SettingsShopProfile {
  const SettingsShopProfileModel({
    required super.id,
    required super.name,
    required super.timezone,
    required super.memberCount,
    required super.createdAt,
  });

  factory SettingsShopProfileModel.fromJson(Map<String, dynamic> json) {
    return SettingsShopProfileModel(
      id: _asString(json['id']),
      name: _asNullableString(json['name']) ?? 'Untitled Shop',
      timezone: _asNullableString(json['timezone']) ?? 'Asia/Yangon',
      memberCount: _asInt(json['member_count']),
      createdAt: _asDateTime(json['created_at']) ?? DateTime.now(),
    );
  }
}

String _asString(dynamic value) {
  if (value == null) {
    return '';
  }

  return value.toString().trim();
}

String? _asNullableString(dynamic value) {
  final normalized = _asString(value);
  if (normalized.isEmpty) {
    return null;
  }

  return normalized;
}

DateTime? _asDateTime(dynamic value) {
  final normalized = _asString(value);
  if (normalized.isEmpty) {
    return null;
  }

  return DateTime.tryParse(normalized);
}

int _asInt(dynamic value) {
  if (value is int) {
    return value;
  }

  return int.tryParse(_asString(value)) ?? 0;
}
