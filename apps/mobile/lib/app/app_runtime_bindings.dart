import 'dart:async';

import 'package:app_push/app_push.dart';
import 'package:app_realtime/app_realtime.dart';
import 'package:flutter/widgets.dart';

import '../features/auth/feature_auth.dart';
import 'di/injection_container.dart';
import 'session/session_expiry_notifier.dart';

class AppRuntimeBindings extends StatefulWidget {
  const AppRuntimeBindings({required this.child, super.key});

  final Widget child;

  @override
  State<AppRuntimeBindings> createState() => _AppRuntimeBindingsState();
}

class _AppRuntimeBindingsState extends State<AppRuntimeBindings> {
  StreamSubscription<AuthState>? _authSubscription;
  StreamSubscription<int>? _sessionExpirySubscription;

  @override
  void initState() {
    super.initState();
    final authBloc = getIt<AuthBloc>();
    final sessionExpiryNotifier = getIt<SessionExpiryNotifier>();
    _handleAuthState(authBloc.state);
    _authSubscription = authBloc.stream.listen(_handleAuthState);
    _sessionExpirySubscription = sessionExpiryNotifier.events.listen((_) {
      authBloc.add(const AuthSessionExpiredDetected());
    });
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    _sessionExpirySubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;

  Future<void> _handleAuthState(AuthState state) async {
    final realtimeService = getIt<AppRealtimeService>();
    final pushRegistrationService = getIt<PushRegistrationService>();
    final activeShop = state.activeShop;

    if (!state.isAuthenticated || activeShop == null) {
      await realtimeService.disconnect();
      return;
    }

    await realtimeService.connect(
      scope: RealtimeScope.shop,
      shopId: activeShop.shopId,
      accessToken: state.session?.accessToken,
    );

    unawaited(
      pushRegistrationService.syncCurrentDevice(locale: state.user?.locale),
    );
  }
}
