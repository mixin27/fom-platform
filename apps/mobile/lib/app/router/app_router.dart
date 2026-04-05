import 'dart:async';

import 'package:app_logger/app_logger.dart';
import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:fom_mobile/features/auth/feature_auth.dart';
import 'package:fom_mobile/features/customers/feature_customers.dart';
import 'package:fom_mobile/features/devtools/feature_devtools.dart';
import 'package:fom_mobile/features/notifications/feature_notifications.dart';
import 'package:fom_mobile/features/onboarding/feature_onboarding.dart';
import 'package:fom_mobile/features/orders/feature_orders.dart';
import 'package:fom_mobile/features/reports/feature_reports.dart';
import 'package:fom_mobile/features/search/feature_search.dart';
import 'package:fom_mobile/features/settings/feature_settings.dart';
import 'package:go_router/go_router.dart';

import 'app_route_paths.dart';

class AppRouter {
  AppRouter({required AppLogger appLogger, required bool enableLogDevTools})
    : _appLogger = appLogger,
      _enableLogDevTools = enableLogDevTools,
      _refreshNotifier = _RouterRefreshNotifier(Stream.value(true));

  static const splashPath = AppRoutePaths.splash;
  static const onboardingPath = AppRoutePaths.onboarding;
  static const authPath = AppRoutePaths.auth;
  static const registerPath = AppRoutePaths.register;
  static const authEmailPath = AppRoutePaths.authEmail;
  static const authOtpPath = AppRoutePaths.authOtp;
  static const devtoolsLogsPath = AppRoutePaths.devtoolsLogs;
  static const ordersPath = AppRoutePaths.orders;
  static const reportsPath = AppRoutePaths.reports;
  static const settingsPath = AppRoutePaths.settings;
  static const notificationsPath = AppRoutePaths.notifications;
  static const searchPath = AppRoutePaths.search;

  final AppLogger _appLogger;
  final bool _enableLogDevTools;
  final _RouterRefreshNotifier _refreshNotifier;
  static final GlobalKey<NavigatorState> _rootNavigatorKey =
      GlobalKey<NavigatorState>();

  late final GoRouter _router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: splashPath,
    refreshListenable: _refreshNotifier,
    redirect: _redirect,
    routes: [
      GoRoute(
        path: splashPath,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: onboardingPath,
        builder: (context, state) => const OnboardingPage(),
      ),
      GoRoute(path: authPath, builder: (context, state) => const LoginPage()),
      GoRoute(
        path: registerPath,
        builder: (context, state) => const RegisterPage(),
      ),
      if (_enableLogDevTools)
        GoRoute(
          path: devtoolsLogsPath,
          builder: (context, state) {
            return LogsDevtoolsPage(logger: _appLogger);
          },
        ),
      GoRoute(
        path: AppRoutePaths.customerProfile,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return CustomerProfilePage(customerId: id);
        },
      ),
      GoRoute(
        path: AppRoutePaths.addOrder,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const AddOrderPage(),
      ),
      GoRoute(
        path: AppRoutePaths.orderDetails,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return OrderDetailsPage(orderId: id);
        },
      ),
      GoRoute(
        path: AppRoutePaths.editProfile,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const EditShopProfilePage(),
      ),
      GoRoute(
        path: notificationsPath,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const NotificationsHomePage(),
      ),
      GoRoute(
        path: searchPath,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const SearchHomePage(),
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
                path: AppRoutePaths.customers,
                builder: (context, state) => const CustomersHomePage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: reportsPath,
                builder: (context, state) => const ReportsHomePage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: settingsPath,
                builder: (context, state) => const SettingsHomePage(),
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
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long, color: AppColors.softOrange),
            label: 'Orders',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people, color: AppColors.softOrange),
            label: 'Customers',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart, color: AppColors.softOrange),
            label: 'Reports',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings, color: AppColors.softOrange),
            label: 'Settings',
          ),
        ],
      ),
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
