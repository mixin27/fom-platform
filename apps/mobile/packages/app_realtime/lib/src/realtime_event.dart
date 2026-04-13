import 'package:equatable/equatable.dart';

import 'realtime_scope.dart';

enum RealtimeEventKind {
  connectionReady,
  notificationCreated,
  notificationRead,
  dataInvalidated,
  ping,
  pong,
  error,
  unknown,
}

class RealtimeEvent extends Equatable {
  const RealtimeEvent({
    required this.kind,
    required this.type,
    this.scope,
    this.shopId,
    this.unreadCount,
    this.notificationId,
    this.notificationTitle,
    this.notificationBody,
    this.resource,
    this.action,
    this.rawData = const <String, dynamic>{},
  });

  final RealtimeEventKind kind;
  final String type;
  final RealtimeScope? scope;
  final String? shopId;
  final int? unreadCount;
  final String? notificationId;
  final String? notificationTitle;
  final String? notificationBody;
  final String? resource;
  final String? action;
  final Map<String, dynamic> rawData;

  bool matchesShop(String shopId) {
    return scope == RealtimeScope.shop && this.shopId == shopId;
  }

  bool invalidatesAny(Set<String> resources) {
    return kind == RealtimeEventKind.dataInvalidated &&
        resource != null &&
        resources.contains(resource);
  }

  factory RealtimeEvent.fromJson(Map<String, dynamic> json) {
    final type = (json['type'] ?? '').toString().trim();
    final scopeValue = (json['scope'] ?? '').toString().trim();
    final scope = switch (scopeValue) {
      'platform' => RealtimeScope.platform,
      'shop' => RealtimeScope.shop,
      _ => null,
    };
    final notification = json['notification'];

    return RealtimeEvent(
      kind: switch (type) {
        'connection.ready' => RealtimeEventKind.connectionReady,
        'notification.created' => RealtimeEventKind.notificationCreated,
        'notification.read' => RealtimeEventKind.notificationRead,
        'data.invalidate' => RealtimeEventKind.dataInvalidated,
        'ping' => RealtimeEventKind.ping,
        'pong' => RealtimeEventKind.pong,
        'error' => RealtimeEventKind.error,
        _ => RealtimeEventKind.unknown,
      },
      type: type.isEmpty ? 'unknown' : type,
      scope: scope,
      shopId: (json['shop_id'] ?? '').toString().trim().isEmpty
          ? null
          : (json['shop_id'] as Object).toString().trim(),
      unreadCount: json['unread_count'] is int
          ? json['unread_count'] as int
          : json['unread_count'] is num
          ? (json['unread_count'] as num).toInt()
          : null,
      notificationId: (json['notification_id'] ?? '').toString().trim().isEmpty
          ? null
          : (json['notification_id'] as Object).toString().trim(),
      notificationTitle: notification is Map
          ? notification['title']?.toString()
          : null,
      notificationBody: notification is Map
          ? notification['body']?.toString()
          : null,
      resource: json['resource']?.toString(),
      action: json['action']?.toString(),
      rawData: Map<String, dynamic>.from(json),
    );
  }

  @override
  List<Object?> get props => <Object?>[
    kind,
    type,
    scope,
    shopId,
    unreadCount,
    notificationId,
    notificationTitle,
    notificationBody,
    resource,
    action,
    rawData,
  ];
}
