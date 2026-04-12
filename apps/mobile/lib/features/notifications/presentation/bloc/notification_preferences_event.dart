import "package:equatable/equatable.dart";

sealed class NotificationPreferencesEvent extends Equatable {
  const NotificationPreferencesEvent();

  @override
  List<Object?> get props => const <Object?>[];
}

class NotificationPreferencesStarted extends NotificationPreferencesEvent {
  const NotificationPreferencesStarted();
}

class NotificationPreferencesToggleRequested
    extends NotificationPreferencesEvent {
  const NotificationPreferencesToggleRequested({
    required this.category,
    required this.enabled,
  });

  final String category;
  final bool enabled;

  @override
  List<Object?> get props => <Object?>[category, enabled];
}

class NotificationPreferencesErrorDismissed
    extends NotificationPreferencesEvent {
  const NotificationPreferencesErrorDismissed();
}
