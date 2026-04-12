import "package:equatable/equatable.dart";

class NotificationPreferenceUpdate extends Equatable {
  const NotificationPreferenceUpdate({
    required this.category,
    this.inAppEnabled,
    this.emailEnabled,
  });

  final String category;
  final bool? inAppEnabled;
  final bool? emailEnabled;

  @override
  List<Object?> get props => <Object?>[category, inAppEnabled, emailEnabled];
}
