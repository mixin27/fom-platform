import "package:equatable/equatable.dart";
import "package:fom_mobile/features/notifications/domain/entities/inbox_notification.dart";

enum NotificationsHomeStatus { initial, loading, ready, error }

class NotificationsHomeState extends Equatable {
  const NotificationsHomeState({
    this.status = NotificationsHomeStatus.initial,
    this.shopId,
    this.shopName = "My Shop",
    this.notifications = const <InboxNotification>[],
    this.isRefreshing = false,
    this.isMarkingAllRead = false,
    this.updatingNotificationIds = const <String>[],
    this.errorMessage,
    this.lastRefreshedAt,
  });

  final NotificationsHomeStatus status;
  final String? shopId;
  final String shopName;
  final List<InboxNotification> notifications;
  final bool isRefreshing;
  final bool isMarkingAllRead;
  final List<String> updatingNotificationIds;
  final String? errorMessage;
  final DateTime? lastRefreshedAt;

  bool get hasShop => (shopId ?? "").trim().isNotEmpty;

  bool get hasNotifications => notifications.isNotEmpty;

  int get unreadCount => notifications.where((item) => !item.isRead).length;

  NotificationsHomeState copyWith({
    NotificationsHomeStatus? status,
    String? shopId,
    String? shopName,
    List<InboxNotification>? notifications,
    bool? isRefreshing,
    bool? isMarkingAllRead,
    List<String>? updatingNotificationIds,
    String? errorMessage,
    bool clearError = false,
    DateTime? lastRefreshedAt,
  }) {
    return NotificationsHomeState(
      status: status ?? this.status,
      shopId: shopId ?? this.shopId,
      shopName: shopName ?? this.shopName,
      notifications: notifications ?? this.notifications,
      isRefreshing: isRefreshing ?? this.isRefreshing,
      isMarkingAllRead: isMarkingAllRead ?? this.isMarkingAllRead,
      updatingNotificationIds:
          updatingNotificationIds ?? this.updatingNotificationIds,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastRefreshedAt: lastRefreshedAt ?? this.lastRefreshedAt,
    );
  }

  @override
  List<Object?> get props => <Object?>[
    status,
    shopId,
    shopName,
    notifications,
    isRefreshing,
    isMarkingAllRead,
    updatingNotificationIds,
    errorMessage,
    lastRefreshedAt,
  ];
}
