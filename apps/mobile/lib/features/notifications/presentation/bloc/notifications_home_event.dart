import "package:equatable/equatable.dart";

sealed class NotificationsHomeEvent extends Equatable {
  const NotificationsHomeEvent();

  @override
  List<Object?> get props => const <Object?>[];
}

class NotificationsHomeStarted extends NotificationsHomeEvent {
  const NotificationsHomeStarted({
    required this.shopId,
    required this.shopName,
  });

  final String shopId;
  final String shopName;

  @override
  List<Object?> get props => <Object?>[shopId, shopName];
}

class NotificationsHomeRefreshRequested extends NotificationsHomeEvent {
  const NotificationsHomeRefreshRequested();
}

class NotificationsHomeNotificationReadRequested extends NotificationsHomeEvent {
  const NotificationsHomeNotificationReadRequested({required this.notificationId});

  final String notificationId;

  @override
  List<Object?> get props => <Object?>[notificationId];
}

class NotificationsHomeMarkAllRequested extends NotificationsHomeEvent {
  const NotificationsHomeMarkAllRequested();
}

class NotificationsHomeErrorDismissed extends NotificationsHomeEvent {
  const NotificationsHomeErrorDismissed();
}
