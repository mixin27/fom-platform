import 'package:equatable/equatable.dart';

class AppAnnouncement extends Equatable {
  const AppAnnouncement({
    required this.id,
    required this.source,
    required this.title,
    required this.body,
    required this.severity,
    required this.status,
    required this.state,
    required this.audiences,
    required this.pinned,
    required this.sortOrder,
    this.ctaLabel,
    this.ctaUrl,
    this.startsAt,
    this.endsAt,
  });

  final String id;
  final String source;
  final String title;
  final String body;
  final String severity;
  final String status;
  final String state;
  final List<String> audiences;
  final String? ctaLabel;
  final String? ctaUrl;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final bool pinned;
  final int sortOrder;

  bool get hasCallToAction {
    return (ctaLabel ?? '').trim().isNotEmpty &&
        (ctaUrl ?? '').trim().isNotEmpty;
  }

  @override
  List<Object?> get props => <Object?>[
    id,
    source,
    title,
    body,
    severity,
    status,
    state,
    audiences,
    ctaLabel,
    ctaUrl,
    startsAt,
    endsAt,
    pinned,
    sortOrder,
  ];
}
