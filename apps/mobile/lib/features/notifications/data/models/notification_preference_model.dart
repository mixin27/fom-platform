import "package:fom_mobile/features/notifications/domain/entities/notification_preference.dart";

class NotificationPreferenceModel extends NotificationPreference {
  const NotificationPreferenceModel({
    required super.category,
    required super.label,
    required super.description,
    required super.inAppEnabled,
    required super.emailEnabled,
    required super.updatedAt,
  });

  factory NotificationPreferenceModel.fromJson(Map<dynamic, dynamic> json) {
    return NotificationPreferenceModel(
      category: (json["category"] ?? "").toString().trim(),
      label: (json["label"] ?? "").toString().trim(),
      description: _asOptionalString(json["description"]),
      inAppEnabled: json["in_app_enabled"] == true,
      emailEnabled: json["email_enabled"] == true,
      updatedAt: _asOptionalDateTime(json["updated_at"]),
    );
  }

  static String? _asOptionalString(dynamic value) {
    if (value == null) {
      return null;
    }

    final normalized = value.toString().trim();
    return normalized.isEmpty ? null : normalized;
  }

  static DateTime? _asOptionalDateTime(dynamic value) {
    final normalized = _asOptionalString(value);
    if (normalized == null) {
      return null;
    }

    return DateTime.tryParse(normalized);
  }
}
