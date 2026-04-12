import "package:equatable/equatable.dart";

class InboxNotification extends Equatable {
  const InboxNotification({
    required this.id,
    required this.shopId,
    required this.shopName,
    required this.category,
    required this.title,
    required this.body,
    required this.actionType,
    required this.actionTarget,
    required this.isRead,
    required this.readAt,
    required this.createdAt,
  });

  final String id;
  final String? shopId;
  final String? shopName;
  final String category;
  final String title;
  final String body;
  final String? actionType;
  final String? actionTarget;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;

  InboxNotification copyWith({
    String? id,
    String? shopId,
    bool clearShopId = false,
    String? shopName,
    bool clearShopName = false,
    String? category,
    String? title,
    String? body,
    String? actionType,
    bool clearActionType = false,
    String? actionTarget,
    bool clearActionTarget = false,
    bool? isRead,
    DateTime? readAt,
    bool clearReadAt = false,
    DateTime? createdAt,
  }) {
    return InboxNotification(
      id: id ?? this.id,
      shopId: clearShopId ? null : (shopId ?? this.shopId),
      shopName: clearShopName ? null : (shopName ?? this.shopName),
      category: category ?? this.category,
      title: title ?? this.title,
      body: body ?? this.body,
      actionType: clearActionType ? null : (actionType ?? this.actionType),
      actionTarget: clearActionTarget
          ? null
          : (actionTarget ?? this.actionTarget),
      isRead: isRead ?? this.isRead,
      readAt: clearReadAt ? null : (readAt ?? this.readAt),
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => <Object?>[
    id,
    shopId,
    shopName,
    category,
    title,
    body,
    actionType,
    actionTarget,
    isRead,
    readAt,
    createdAt,
  ];
}
