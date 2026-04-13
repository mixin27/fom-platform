import 'dart:async';

import 'package:app_push/app_push.dart';
import 'package:app_realtime/app_realtime.dart';
import 'package:flutter/widgets.dart';

import '../features/auth/feature_auth.dart';
import 'di/injection_container.dart';

class AppRuntimeBindings extends StatefulWidget {
  const AppRuntimeBindings({required this.child, super.key});

  final Widget child;

  @override
  State<AppRuntimeBindings> createState() => _AppRuntimeBindingsState();
}

class _AppRuntimeBindingsState extends State<AppRuntimeBindings> {
  StreamSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    final authBloc = getIt<AuthBloc>();
    _handleAuthState(authBloc.state);
    _authSubscription = authBloc.stream.listen(_handleAuthState);
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
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
    );

    unawaited(
      pushRegistrationService.syncCurrentDevice(locale: state.user?.locale),
    );
  }
}
