import '../../domain/entities/settings_account_profile.dart';

class SettingsAccountProfileModel extends SettingsAccountProfile {
  const SettingsAccountProfileModel({
    required super.id,
    required super.name,
    required super.email,
    required super.phone,
    required super.locale,
    required super.emailVerifiedAt,
    required super.phoneVerifiedAt,
    required super.createdAt,
  });

  factory SettingsAccountProfileModel.fromJson(Map<String, dynamic> json) {
    return SettingsAccountProfileModel(
      id: _asString(json['id']),
      name: _asNullableString(json['name']) ?? 'Unknown User',
      email: _asNullableString(json['email']),
      phone: _asNullableString(json['phone']),
      locale: _asNullableString(json['locale']) ?? 'my',
      emailVerifiedAt: _asDateTime(json['email_verified_at']),
      phoneVerifiedAt: _asDateTime(json['phone_verified_at']),
      createdAt: _asDateTime(json['created_at']),
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
