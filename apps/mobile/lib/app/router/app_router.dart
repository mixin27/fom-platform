import 'dart:async';

import 'package:app_logger/app_logger.dart';
import 'package:flutter/material.dart';
import 'package:fom_mobile/features/devtools/feature_devtools.dart';
import 'package:fom_mobile/features/orders/feature_orders.dart';
import 'package:go_router/go_router.dart';

import 'app_route_paths.dart';

class AppRouter {
  AppRouter({required AppLogger appLogger, required bool enableLogDevTools})
    : _appLogger = appLogger,
      _enableLogDevTools = enableLogDevTools,
      _refreshNotifier = _RouterRefreshNotifier(Stream.value(true));

  static const authPath = AppRoutePaths.auth;
  static const authEmailPath = AppRoutePaths.authEmail;
  static const authOtpPath = AppRoutePaths.authOtp;
  static const devtoolsLogsPath = AppRoutePaths.devtoolsLogs;
  static const ordersPath = AppRoutePaths.orders;

  final AppLogger _appLogger;
  final bool _enableLogDevTools;
  final _RouterRefreshNotifier _refreshNotifier;

  late final GoRouter _router = GoRouter(
    initialLocation: ordersPath,
    refreshListenable: _refreshNotifier,
    redirect: _redirect,
    routes: [
      GoRoute(
        path: authPath,
        builder: (context, state) {
          return const Scaffold();
        },
      ),
      if (_enableLogDevTools)
        GoRoute(
          path: devtoolsLogsPath,
          builder: (context, state) {
            return LogsDevtoolsPage(logger: _appLogger);
          },
        ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: ordersPath,
                builder: (context, state) => const OrdersHomePage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/two',
                builder: (context, state) =>
                    const _DetailUnavailablePage(title: 'Two'),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/three',
                builder: (context, state) =>
                    const _DetailUnavailablePage(title: 'Three'),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/four',
                builder: (context, state) =>
                    const _DetailUnavailablePage(title: 'Four'),
              ),
            ],
          ),
        ],
      ),
    ],
  );

  GoRouter get config => _router;

  String? _redirect(BuildContext context, GoRouterState state) {
    return null;
  }

  bool isAuthPath(String path) {
    return path == authPath || path.startsWith('$authPath/');
  }

  String authRedirectPath({required String from}) {
    return Uri(
      path: authPath,
      queryParameters: <String, String>{'from': from},
    ).toString();
  }

  String? readFrom(Uri uri) {
    final from = uri.queryParameters['from'];
    if (from == null || from.isEmpty) {
      return null;
    }

    return from;
  }
}

class AppShell extends StatelessWidget {
  const AppShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(
            index,
            initialLocation: index == navigationShell.currentIndex,
          );
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.campaign_outlined),
            label: 'One',
          ),
          NavigationDestination(
            icon: Icon(Icons.confirmation_num_outlined),
            label: 'Two',
          ),
          NavigationDestination(
            icon: Icon(Icons.loyalty_outlined),
            label: 'Three',
          ),
          NavigationDestination(
            icon: Icon(Icons.notifications_outlined),
            label: 'Four',
          ),
        ],
      ),
    );
  }
}

class _DetailUnavailablePage extends StatelessWidget {
  const _DetailUnavailablePage({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Unavailable')),
      body: Center(child: Text(title)),
    );
  }
}

class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(Stream<dynamic> stream) {
    _subscription = stream.listen((_) => notifyListeners());
  }

  late final StreamSubscription _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
