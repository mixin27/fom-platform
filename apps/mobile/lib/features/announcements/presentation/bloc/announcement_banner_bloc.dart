import 'package:app_logger/app_logger.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/app_announcement.dart';
import '../../domain/usecases/dismiss_announcement_use_case.dart';
import '../../domain/usecases/fetch_public_announcements_use_case.dart';
import '../../domain/usecases/fetch_shop_announcements_use_case.dart';
import 'announcement_banner_event.dart';
import 'announcement_banner_state.dart';

class AnnouncementBannerBloc
    extends Bloc<AnnouncementBannerEvent, AnnouncementBannerState>
    with LoggerMixin {
  AnnouncementBannerBloc({
    required FetchPublicAnnouncementsUseCase fetchPublicAnnouncementsUseCase,
    required FetchShopAnnouncementsUseCase fetchShopAnnouncementsUseCase,
    required DismissAnnouncementUseCase dismissAnnouncementUseCase,
    AppLogger? logger,
  }) : _fetchPublicAnnouncementsUseCase = fetchPublicAnnouncementsUseCase,
       _fetchShopAnnouncementsUseCase = fetchShopAnnouncementsUseCase,
       _dismissAnnouncementUseCase = dismissAnnouncementUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const AnnouncementBannerState()) {
    on<AnnouncementBannerStarted>(_onStarted);
    on<AnnouncementBannerRefreshRequested>(_onRefreshRequested);
    on<AnnouncementBannerDismissed>(_onDismissed);
  }

  final FetchPublicAnnouncementsUseCase _fetchPublicAnnouncementsUseCase;
  final FetchShopAnnouncementsUseCase _fetchShopAnnouncementsUseCase;
  final DismissAnnouncementUseCase _dismissAnnouncementUseCase;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('AnnouncementBannerBloc');

  Future<void> _onStarted(
    AnnouncementBannerStarted event,
    Emitter<AnnouncementBannerState> emit,
  ) async {
    emit(
      state.copyWith(
        status: AnnouncementBannerStatus.loading,
        surface: event.surface,
        audience: event.audience,
        shopId: event.shopId,
        clearError: true,
      ),
    );

    await _loadAnnouncements(emit);
  }

  Future<void> _onRefreshRequested(
    AnnouncementBannerRefreshRequested event,
    Emitter<AnnouncementBannerState> emit,
  ) async {
    if (state.surface == null) {
      return;
    }

    await _loadAnnouncements(emit);
  }

  Future<void> _onDismissed(
    AnnouncementBannerDismissed event,
    Emitter<AnnouncementBannerState> emit,
  ) async {
    final scope = state.scope;
    if ((scope ?? '').isEmpty) {
      return;
    }

    emit(
      state.copyWith(
        announcements: state.announcements
            .where((item) => item.id != event.announcementId)
            .toList(growable: false),
      ),
    );

    try {
      await _dismissAnnouncementUseCase(
        scope: scope!,
        announcementId: event.announcementId,
      );
    } catch (error, stackTrace) {
      log.warning('Failed to dismiss announcement: $error');
      log.error(
        'Announcement dismiss error details',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  Future<void> _loadAnnouncements(Emitter<AnnouncementBannerState> emit) async {
    if (state.surface == null) {
      return;
    }

    switch (state.surface!) {
      case AnnouncementSurface.publicAuth:
        final result = await _fetchPublicAnnouncementsUseCase(
          FetchPublicAnnouncementsParams(audience: state.audience ?? 'auth'),
        );
        if (isClosed) {
          return;
        }
        result.fold(
          (failure) {
            emit(
              state.copyWith(
                status: AnnouncementBannerStatus.ready,
                announcements: const <AppAnnouncement>[],
                errorMessage: failure.message,
              ),
            );
          },
          (announcements) {
            emit(
              state.copyWith(
                status: AnnouncementBannerStatus.ready,
                announcements: announcements,
                clearError: true,
                lastUpdatedAt: DateTime.now(),
              ),
            );
          },
        );
        return;
      case AnnouncementSurface.shop:
        final shopId = (state.shopId ?? '').trim();
        if (shopId.isEmpty) {
          emit(
            state.copyWith(
              status: AnnouncementBannerStatus.ready,
              announcements: const <AppAnnouncement>[],
              clearError: true,
            ),
          );
          return;
        }
        final result = await _fetchShopAnnouncementsUseCase(
          FetchShopAnnouncementsParams(shopId: shopId),
        );
        if (isClosed) {
          return;
        }
        result.fold(
          (failure) {
            emit(
              state.copyWith(
                status: AnnouncementBannerStatus.ready,
                announcements: const <AppAnnouncement>[],
                errorMessage: failure.message,
              ),
            );
          },
          (announcements) {
            emit(
              state.copyWith(
                status: AnnouncementBannerStatus.ready,
                announcements: announcements,
                clearError: true,
                lastUpdatedAt: DateTime.now(),
              ),
            );
          },
        );
        return;
    }
  }
}
