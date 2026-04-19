import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fom_mobile/app/di/injection_container.dart';
import 'package:fom_mobile/app/router/app_route_paths.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../domain/entities/app_announcement.dart';
import '../bloc/announcement_banner_bloc.dart';
import '../bloc/announcement_banner_event.dart';
import '../bloc/announcement_banner_state.dart';

class AnnouncementBannerHost extends StatefulWidget {
  const AnnouncementBannerHost.publicAuth({
    super.key,
    this.padding = const EdgeInsets.fromLTRB(16, 16, 16, 0),
    this.maxItems = 2,
  }) : shopId = null,
       audience = 'auth',
       surface = AnnouncementSurface.publicAuth;

  const AnnouncementBannerHost.shop({
    required this.shopId,
    super.key,
    this.padding = const EdgeInsets.fromLTRB(12, 8, 12, 4),
    this.maxItems = 2,
  }) : audience = null,
       surface = AnnouncementSurface.shop;

  final AnnouncementSurface surface;
  final String? audience;
  final String? shopId;
  final EdgeInsetsGeometry padding;
  final int maxItems;

  @override
  State<AnnouncementBannerHost> createState() => _AnnouncementBannerHostState();
}

class _AnnouncementBannerHostState extends State<AnnouncementBannerHost> {
  late final AnnouncementBannerBloc _bloc;

  @override
  void initState() {
    super.initState();
    _bloc = getIt<AnnouncementBannerBloc>();
    _load();
  }

  @override
  void didUpdateWidget(covariant AnnouncementBannerHost oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.surface != widget.surface ||
        oldWidget.audience != widget.audience ||
        oldWidget.shopId != widget.shopId) {
      _load();
    }
  }

  @override
  void dispose() {
    _bloc.close();
    super.dispose();
  }

  void _load() {
    switch (widget.surface) {
      case AnnouncementSurface.publicAuth:
        _bloc.add(const AnnouncementBannerStarted.publicAuth());
        return;
      case AnnouncementSurface.shop:
        final shopId = (widget.shopId ?? '').trim();
        if (shopId.isEmpty) {
          return;
        }
        _bloc.add(AnnouncementBannerStarted.shop(shopId: shopId));
        return;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.surface == AnnouncementSurface.shop &&
        (widget.shopId ?? '').trim().isEmpty) {
      return const SizedBox.shrink();
    }

    return BlocProvider<AnnouncementBannerBloc>.value(
      value: _bloc,
      child: BlocBuilder<AnnouncementBannerBloc, AnnouncementBannerState>(
        builder: (context, state) {
          if (!state.hasAnnouncements) {
            return const SizedBox.shrink();
          }

          final visibleAnnouncements = state.announcements
              .take(widget.maxItems)
              .toList(growable: false);

          return Padding(
            padding: widget.padding,
            child: Column(
              children: visibleAnnouncements
                  .map(
                    (announcement) => Padding(
                      padding: EdgeInsets.only(
                        bottom: announcement == visibleAnnouncements.last
                            ? 0
                            : 10,
                      ),
                      child: _AnnouncementBannerCard(
                        announcement: announcement,
                        onDismissed: () {
                          context.read<AnnouncementBannerBloc>().add(
                            AnnouncementBannerDismissed(
                              announcementId: announcement.id,
                            ),
                          );
                        },
                        onCallToActionTap: announcement.hasCallToAction
                            ? () => _handleAnnouncementAction(
                                context,
                                announcement,
                              )
                            : null,
                      ),
                    ),
                  )
                  .toList(growable: false),
            ),
          );
        },
      ),
    );
  }

  Future<void> _handleAnnouncementAction(
    BuildContext context,
    AppAnnouncement announcement,
  ) async {
    final rawUrl = announcement.ctaUrl?.trim();
    if ((rawUrl ?? '').isEmpty) {
      return;
    }

    final parsed = Uri.tryParse(rawUrl!);
    final knownPath = _resolveKnownPath(rawUrl, parsed);
    final mobileRoute = _mapPortalPathToMobileRoute(knownPath);

    if (mobileRoute != null) {
      final primaryRoutes = <String>{
        AppRoutePaths.orders,
        AppRoutePaths.customers,
        AppRoutePaths.reports,
        AppRoutePaths.settings,
      };

      if (primaryRoutes.contains(mobileRoute)) {
        context.go(mobileRoute);
      } else {
        context.push(mobileRoute);
      }
      return;
    }

    final launchUri = _resolveLaunchUri(rawUrl, parsed, knownPath);
    if (launchUri == null) {
      return;
    }

    try {
      final launched = await launchUrl(
        launchUri,
        mode: LaunchMode.externalApplication,
      );
      if (launched || !context.mounted) {
        return;
      }
    } catch (_) {
      if (!context.mounted) {
        return;
      }
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Could not open this announcement action right now.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  String? _resolveKnownPath(String rawUrl, Uri? parsed) {
    if (parsed == null) {
      return rawUrl.startsWith('/') ? rawUrl : null;
    }

    if (!parsed.hasScheme) {
      return rawUrl.startsWith('/') ? rawUrl : null;
    }

    final host = parsed.host.toLowerCase();
    if (host.endsWith('getfom.com') || host == 'localhost') {
      return parsed.path;
    }

    return null;
  }

  String? _mapPortalPathToMobileRoute(String? path) {
    switch ((path ?? '').trim()) {
      case '/dashboard/orders':
        return AppRoutePaths.orders;
      case '/dashboard/customers':
        return AppRoutePaths.customers;
      case '/dashboard/reports':
        return AppRoutePaths.reports;
      case '/dashboard/settings':
      case '/dashboard/billing':
        return AppRoutePaths.settings;
      default:
        return null;
    }
  }

  Uri? _resolveLaunchUri(String rawUrl, Uri? parsed, String? knownPath) {
    if (parsed != null && parsed.hasScheme) {
      return parsed;
    }

    if ((knownPath ?? '').isNotEmpty) {
      return Uri.parse('https://getfom.com$knownPath');
    }

    return Uri.tryParse(rawUrl);
  }
}

class _AnnouncementBannerCard extends StatelessWidget {
  const _AnnouncementBannerCard({
    required this.announcement,
    required this.onDismissed,
    this.onCallToActionTap,
  });

  final AppAnnouncement announcement;
  final VoidCallback onDismissed;
  final VoidCallback? onCallToActionTap;

  @override
  Widget build(BuildContext context) {
    final palette = _AnnouncementPalette.fromSeverity(announcement.severity);

    return Container(
      decoration: BoxDecoration(
        color: palette.backgroundColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: palette.borderColor, width: 1.5),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: palette.iconBackgroundColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: Icon(palette.icon, size: 18, color: palette.iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      announcement.title,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: palette.titleColor,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      announcement.body,
                      style: TextStyle(
                        fontSize: 11,
                        height: 1.45,
                        fontWeight: FontWeight.w600,
                        color: palette.messageColor,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: onDismissed,
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    Icons.close_rounded,
                    size: 16,
                    color: palette.titleColor,
                  ),
                ),
              ),
            ],
          ),
          if (announcement.hasCallToAction && onCallToActionTap != null) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: onCallToActionTap,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    announcement.ctaLabel!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: palette.actionColor,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 16,
                    color: palette.actionColor,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AnnouncementPalette {
  const _AnnouncementPalette({
    required this.icon,
    required this.iconColor,
    required this.iconBackgroundColor,
    required this.backgroundColor,
    required this.borderColor,
    required this.titleColor,
    required this.messageColor,
    required this.actionColor,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBackgroundColor;
  final Color backgroundColor;
  final Color borderColor;
  final Color titleColor;
  final Color messageColor;
  final Color actionColor;

  factory _AnnouncementPalette.fromSeverity(String severity) {
    switch (severity.trim().toLowerCase()) {
      case 'critical':
        return const _AnnouncementPalette(
          icon: Icons.error_outline_rounded,
          iconColor: Color(0xFFB91C1C),
          iconBackgroundColor: Color(0xFFFECACA),
          backgroundColor: Color(0xFFFEF2F2),
          borderColor: Color(0xFFFCA5A5),
          titleColor: Color(0xFF991B1B),
          messageColor: Color(0xFFB91C1C),
          actionColor: Color(0xFF991B1B),
        );
      case 'warning':
        return const _AnnouncementPalette(
          icon: Icons.warning_amber_rounded,
          iconColor: Color(0xFFB45309),
          iconBackgroundColor: Color(0xFFFDE68A),
          backgroundColor: Color(0xFFFEF3C7),
          borderColor: Color(0xFFFCD34D),
          titleColor: Color(0xFF92400E),
          messageColor: Color(0xFFB45309),
          actionColor: Color(0xFF92400E),
        );
      default:
        return const _AnnouncementPalette(
          icon: Icons.info_outline_rounded,
          iconColor: Color(0xFF0F766E),
          iconBackgroundColor: AppColors.tealLight,
          backgroundColor: Color(0xFFF0FDFA),
          borderColor: Color(0xFF99F6E4),
          titleColor: Color(0xFF115E59),
          messageColor: Color(0xFF0F766E),
          actionColor: Color(0xFF115E59),
        );
    }
  }
}
