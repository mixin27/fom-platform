import "package:fom_mobile/features/notifications/domain/entities/inbox_notification.dart";

class InboxNotificationModel extends InboxNotification {
  const InboxNotificationModel({
    required super.id,
    required super.shopId,
    required super.shopName,
    required super.category,
    required super.title,
    required super.body,
    required super.actionType,
    required super.actionTarget,
    required super.isRead,
    required super.readAt,
    required super.createdAt,
  });

  factory InboxNotificationModel.fromJson(Map<dynamic, dynamic> json) {
    return InboxNotificationModel(
      id: (json["id"] ?? "").toString().trim(),
      shopId: _asOptionalString(json["shop_id"]),
      shopName: _asOptionalString(json["shop_name"]),
      category: (json["category"] ?? "").toString().trim(),
      title: (json["title"] ?? "").toString().trim(),
      body: (json["body"] ?? "").toString().trim(),
      actionType: _asOptionalString(json["action_type"]),
      actionTarget: _asOptionalString(json["action_target"]),
      isRead: json["is_read"] == true,
      readAt: _asOptionalDateTime(json["read_at"]),
      createdAt: _asDateTime(json["created_at"]),
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

  static DateTime _asDateTime(dynamic value) {
    final normalized = _asOptionalString(value);
    return DateTime.tryParse(normalized ?? "") ?? DateTime.fromMillisecondsSinceEpoch(0);
  }
}
