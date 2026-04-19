import 'package:equatable/equatable.dart';

import '../../domain/entities/app_announcement.dart';
import 'announcement_banner_event.dart';

enum AnnouncementBannerStatus { initial, loading, ready }

class AnnouncementBannerState extends Equatable {
  const AnnouncementBannerState({
    this.status = AnnouncementBannerStatus.initial,
    this.surface,
    this.audience,
    this.shopId,
    this.announcements = const <AppAnnouncement>[],
    this.errorMessage,
    this.lastUpdatedAt,
  });

  final AnnouncementBannerStatus status;
  final AnnouncementSurface? surface;
  final String? audience;
  final String? shopId;
  final List<AppAnnouncement> announcements;
  final String? errorMessage;
  final DateTime? lastUpdatedAt;

  bool get hasAnnouncements => announcements.isNotEmpty;

  String? get scope {
    switch (surface) {
      case AnnouncementSurface.publicAuth:
        final normalizedAudience = (audience ?? 'auth').trim().toLowerCase();
        return 'public:$normalizedAudience';
      case AnnouncementSurface.shop:
        final normalizedShopId = (shopId ?? '').trim();
        if (normalizedShopId.isEmpty) {
          return null;
        }
        return 'shop:$normalizedShopId';
      case null:
        return null;
    }
  }

  AnnouncementBannerState copyWith({
    AnnouncementBannerStatus? status,
    AnnouncementSurface? surface,
    String? audience,
    String? shopId,
    List<AppAnnouncement>? announcements,
    String? errorMessage,
    bool clearError = false,
    DateTime? lastUpdatedAt,
  }) {
    return AnnouncementBannerState(
      status: status ?? this.status,
      surface: surface ?? this.surface,
      audience: audience ?? this.audience,
      shopId: shopId ?? this.shopId,
      announcements: announcements ?? this.announcements,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      lastUpdatedAt: lastUpdatedAt ?? this.lastUpdatedAt,
    );
  }

  @override
  List<Object?> get props => <Object?>[
    status,
    surface,
    audience,
    shopId,
    announcements,
    errorMessage,
    lastUpdatedAt,
  ];
}
