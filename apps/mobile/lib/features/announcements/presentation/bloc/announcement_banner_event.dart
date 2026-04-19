import 'package:equatable/equatable.dart';

sealed class AnnouncementBannerEvent extends Equatable {
  const AnnouncementBannerEvent();

  @override
  List<Object?> get props => const <Object?>[];
}

enum AnnouncementSurface { publicAuth, shop }

class AnnouncementBannerStarted extends AnnouncementBannerEvent {
  const AnnouncementBannerStarted.publicAuth()
    : surface = AnnouncementSurface.publicAuth,
      audience = 'auth',
      shopId = null;

  const AnnouncementBannerStarted.shop({required this.shopId})
    : surface = AnnouncementSurface.shop,
      audience = null;

  final AnnouncementSurface surface;
  final String? audience;
  final String? shopId;

  @override
  List<Object?> get props => <Object?>[surface, audience, shopId];
}

class AnnouncementBannerRefreshRequested extends AnnouncementBannerEvent {
  const AnnouncementBannerRefreshRequested();
}

class AnnouncementBannerDismissed extends AnnouncementBannerEvent {
  const AnnouncementBannerDismissed({required this.announcementId});

  final String announcementId;

  @override
  List<Object?> get props => <Object?>[announcementId];
}
