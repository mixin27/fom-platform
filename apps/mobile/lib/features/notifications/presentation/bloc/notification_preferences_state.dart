import "package:equatable/equatable.dart";
import "package:fom_mobile/features/notifications/domain/entities/notification_preference.dart";

enum NotificationPreferencesStatus { initial, loading, ready, error }

class NotificationPreferencesState extends Equatable {
  const NotificationPreferencesState({
    this.status = NotificationPreferencesStatus.initial,
    this.preferences = const <NotificationPreference>[],
    this.updatingCategories = const <String>[],
    this.errorMessage,
  });

  final NotificationPreferencesStatus status;
  final List<NotificationPreference> preferences;
  final List<String> updatingCategories;
  final String? errorMessage;

  bool get hasPreferences => preferences.isNotEmpty;

  NotificationPreference? preferenceFor(String category) {
    for (final preference in preferences) {
      if (preference.category == category) {
        return preference;
      }
    }

    return null;
  }

  NotificationPreferencesState copyWith({
    NotificationPreferencesStatus? status,
    List<NotificationPreference>? preferences,
    List<String>? updatingCategories,
    String? errorMessage,
    bool clearError = false,
  }) {
    return NotificationPreferencesState(
      status: status ?? this.status,
      preferences: preferences ?? this.preferences,
      updatingCategories: updatingCategories ?? this.updatingCategories,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => <Object?>[
    status,
    preferences,
    updatingCategories,
    errorMessage,
  ];
}
