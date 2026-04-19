import '../../domain/entities/app_announcement.dart';

class AppAnnouncementModel extends AppAnnouncement {
  const AppAnnouncementModel({
    required super.id,
    required super.source,
    required super.title,
    required super.body,
    required super.severity,
    required super.status,
    required super.state,
    required super.audiences,
    required super.pinned,
    required super.sortOrder,
    super.ctaLabel,
    super.ctaUrl,
    super.startsAt,
    super.endsAt,
  });

  factory AppAnnouncementModel.fromJson(Map<String, dynamic> json) {
    return AppAnnouncementModel(
      id: _asString(json['id']),
      source: _asString(json['source']),
      title: _asString(json['title']),
      body: _asString(json['body']),
      severity: _asString(json['severity']).toLowerCase(),
      status: _asString(json['status']).toLowerCase(),
      state: _asString(json['state']).toLowerCase(),
      audiences: _asStringList(json['audiences']),
      ctaLabel: _asNullableString(json['cta_label']),
      ctaUrl: _asNullableString(json['cta_url']),
      startsAt: _asDateTime(json['starts_at']),
      endsAt: _asDateTime(json['ends_at']),
      pinned: _asBool(json['pinned']),
      sortOrder: _asInt(json['sort_order']),
    );
  }
}

String _asString(dynamic value) {
  if (value == null) {
    return '';
  }

  return value.toString().trim();
}

String? _asNullableString(dynamic value) {
  final normalized = _asString(value);
  if (normalized.isEmpty) {
    return null;
  }

  return normalized;
}

DateTime? _asDateTime(dynamic value) {
  final normalized = _asString(value);
  if (normalized.isEmpty) {
    return null;
  }

  return DateTime.tryParse(normalized);
}

bool _asBool(dynamic value) {
  if (value is bool) {
    return value;
  }

  return _asString(value).toLowerCase() == 'true';
}

int _asInt(dynamic value) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(_asString(value)) ?? 0;
}

List<String> _asStringList(dynamic value) {
  if (value is List) {
    return value
        .map((dynamic item) => item.toString().trim())
        .where((item) => item.isNotEmpty)
        .toList(growable: false);
  }

  return const <String>[];
}
