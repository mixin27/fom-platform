import "package:equatable/equatable.dart";

class NotificationPreference extends Equatable {
  const NotificationPreference({
    required this.category,
    required this.label,
    required this.description,
    required this.inAppEnabled,
    required this.emailEnabled,
    required this.updatedAt,
  });

  final String category;
  final String label;
  final String? description;
  final bool inAppEnabled;
  final bool emailEnabled;
  final DateTime? updatedAt;

  NotificationPreference copyWith({
    String? category,
    String? label,
    String? description,
    bool clearDescription = false,
    bool? inAppEnabled,
    bool? emailEnabled,
    DateTime? updatedAt,
    bool clearUpdatedAt = false,
  }) {
    return NotificationPreference(
      category: category ?? this.category,
      label: label ?? this.label,
      description: clearDescription ? null : (description ?? this.description),
      inAppEnabled: inAppEnabled ?? this.inAppEnabled,
      emailEnabled: emailEnabled ?? this.emailEnabled,
      updatedAt: clearUpdatedAt ? null : (updatedAt ?? this.updatedAt),
    );
  }

  @override
  List<Object?> get props => <Object?>[
    category,
    label,
    description,
    inAppEnabled,
    emailEnabled,
    updatedAt,
  ];
}
