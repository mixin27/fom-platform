import 'dart:async';

import 'package:app_localizations/app_localizations.dart';
import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
  AppRouter({
    required AppLogger appLogger,
    required AuthBloc authBloc,
    required OnboardingBloc onboardingBloc,
    required NetworkConnectionService networkConnectionService,
    required bool enableLogDevTools,
  }) : _appLogger = appLogger,
       _authBloc = authBloc,
       _onboardingBloc = onboardingBloc,
       _networkConnectionService = networkConnectionService,
       _enableLogDevTools = enableLogDevTools,
       _refreshNotifier = _RouterRefreshNotifier(<Stream<dynamic>>[
         authBloc.stream,
         onboardingBloc.stream,
       ]);

  static const splashPath = AppRoutePaths.splash;
  static const onboardingPath = AppRoutePaths.onboarding;
  static const authPath = AppRoutePaths.auth;
  static const registerPath = AppRoutePaths.register;
  static const authEmailPath = AppRoutePaths.authEmail;
  static const authOtpPath = AppRoutePaths.authOtp;
  static const shopSelectionPath = AppRoutePaths.shopSelection;
  static const devtoolsLogsPath = AppRoutePaths.devtoolsLogs;
  static const ordersPath = AppRoutePaths.orders;
  static const reportsPath = AppRoutePaths.reports;
  static const settingsPath = AppRoutePaths.settings;
  static const notificationsPath = AppRoutePaths.notifications;
  static const searchPath = AppRoutePaths.search;

  final AppLogger _appLogger;
  final AuthBloc _authBloc;
  final OnboardingBloc _onboardingBloc;
  final NetworkConnectionService _networkConnectionService;
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
      GoRoute(
        path: shopSelectionPath,
        builder: (context, state) =>
            ShopSelectionPage(returnTo: readFrom(state.uri)),
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
          return CustomerProfilePage(
            customerId: id,
            shopId: _resolveCurrentShopId(),
            shopName: _resolveCurrentShopName(),
          );
        },
      ),
      GoRoute(
        path: AppRoutePaths.customerOrders,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final customerName =
              state.uri.queryParameters['customer_name']?.trim() ?? 'Customer';
          final customerPhone =
              state.uri.queryParameters['customer_phone']?.trim() ?? '';
          final customerId = state.pathParameters['id'] ?? '';
          return CustomerOrdersPage(
            customerId: customerId,
            customerName: customerName.isEmpty ? 'Customer' : customerName,
            customerPhone: customerPhone,
            shopId: _resolveCurrentShopId(),
          );
        },
      ),
      GoRoute(
        path: AppRoutePaths.addOrder,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => AddOrderPage(
          initialShopId: _resolveCurrentShopId(),
          initialShopName: _resolveCurrentShopName(),
        ),
      ),
      GoRoute(
        path: AppRoutePaths.orderDetails,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return OrderDetailsPage(
            orderId: id,
            initialShopId: _resolveCurrentShopId(),
          );
        },
      ),
      GoRoute(
        path: AppRoutePaths.editProfile,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const EditShopProfilePage(),
      ),
      GoRoute(
        path: AppRoutePaths.settingsExports,
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) => const ShopExportsPage(),
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
          return AppShell(
            authBloc: _authBloc,
            navigationShell: navigationShell,
            networkConnectionService: _networkConnectionService,
          );
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: ordersPath,
                builder: (context, state) => OrdersHomePage(
                  initialShopId: _resolveCurrentShopId(),
                  initialShopName: _resolveCurrentShopName(),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutePaths.customers,
                builder: (context, state) => CustomersHomePage(
                  initialShopId: _resolveCurrentShopId(),
                  initialShopName: _resolveCurrentShopName(),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: reportsPath,
                builder: (context, state) => ReportsHomePage(
                  initialShopId: _resolveCurrentShopId(),
                  initialShopName: _resolveCurrentShopName(),
                ),
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
    final path = state.uri.path;
    final authStatus = _authBloc.state.status;
    final onboardingStatus = _onboardingBloc.state.status;
    final isSplash = path == splashPath;
    final isPublicRoute = _isPublicRoute(path);
    final hasCompletedOnboarding =
        onboardingStatus == OnboardingStatus.completed;

    if (authStatus == AuthStatus.unknown ||
        onboardingStatus == OnboardingStatus.unknown ||
        onboardingStatus == OnboardingStatus.loading) {
      return isSplash ? null : splashPath;
    }

    if (authStatus == AuthStatus.unauthenticated) {
      if (path == onboardingPath && hasCompletedOnboarding) {
        return authPath;
      }

      if (isSplash) {
        return null;
      }

      if (isPublicRoute) {
        return null;
      }

      return authRedirectPath(from: state.uri.toString());
    }

    if (_authBloc.state.hasNoShopAccess ||
        _authBloc.state.requiresShopSelection) {
      if (path == shopSelectionPath) {
        return null;
      }

      return Uri(
        path: shopSelectionPath,
        queryParameters: <String, String>{'from': state.uri.toString()},
      ).toString();
    }

    if (isSplash || path == onboardingPath || isAuthPath(path)) {
      final from = readFrom(state.uri);
      return from ?? ordersPath;
    }

    return null;
  }

  bool isAuthPath(String path) {
    return path == authPath ||
        path.startsWith('$authPath/') ||
        path == registerPath;
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

  bool _isPublicRoute(String path) {
    return path == splashPath ||
        path == onboardingPath ||
        path == authPath ||
        path == registerPath ||
        path == authEmailPath ||
        path == authOtpPath;
  }

  String _resolveCurrentShopId() {
    final shop = _authBloc.state.activeShop;
    if (shop == null) {
      return "";
    }

    return shop.shopId;
  }

  String _resolveCurrentShopName() {
    final rawName = _authBloc.state.activeShop?.shopName.trim() ?? "";
    if (rawName.isEmpty) {
      return "My Shop";
    }

    return rawName;
  }
}

class AppShell extends StatelessWidget {
  const AppShell({
    required this.authBloc,
    required this.navigationShell,
    required this.networkConnectionService,
    super.key,
  });

  final AuthBloc authBloc;
  final StatefulNavigationShell navigationShell;
  final NetworkConnectionService networkConnectionService;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: StreamBuilder<NetworkConnectionStatus>(
        stream: networkConnectionService.statusStream,
        initialData: networkConnectionService.currentStatus,
        builder: (context, snapshot) {
          final networkStatus =
              snapshot.data ?? NetworkConnectionStatus.unknown();

          return Column(
            children: [
              if (networkStatus.isOffline)
                SafeArea(
                  top: true,
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                    child: AppConnectionBanner(
                      isOnline: networkStatus.isOnline,
                      transportLabel: networkStatus.primaryTransportLabel,
                    ),
                  ),
                ),
              Expanded(child: navigationShell),
            ],
          );
        },
      ),
      bottomNavigationBar: BlocBuilder<AuthBloc, AuthState>(
        bloc: authBloc,
        builder: (context, authState) {
          final l10n = context.l10n;
          final canManageShopSettings =
              authState.activeShop?.permissions.contains('shops.write') ??
              false;

          return NavigationBar(
            selectedIndex: navigationShell.currentIndex,
            onDestinationSelected: (index) {
              navigationShell.goBranch(
                index,
                initialLocation: index == navigationShell.currentIndex,
              );
            },
            destinations: [
              NavigationDestination(
                icon: const Icon(Icons.receipt_long_outlined),
                selectedIcon: const Icon(
                  Icons.receipt_long,
                  color: AppColors.softOrange,
                ),
                label: l10n.navOrders,
              ),
              NavigationDestination(
                icon: const Icon(Icons.people_outline),
                selectedIcon: const Icon(
                  Icons.people,
                  color: AppColors.softOrange,
                ),
                label: l10n.navCustomers,
              ),
              NavigationDestination(
                icon: const Icon(Icons.bar_chart_outlined),
                selectedIcon: const Icon(
                  Icons.bar_chart,
                  color: AppColors.softOrange,
                ),
                label: l10n.navReports,
              ),
              NavigationDestination(
                icon: Icon(
                  canManageShopSettings
                      ? Icons.settings_outlined
                      : Icons.person_outline_rounded,
                ),
                selectedIcon: Icon(
                  canManageShopSettings ? Icons.settings : Icons.person_rounded,
                  color: AppColors.softOrange,
                ),
                label: canManageShopSettings
                    ? l10n.navSettings
                    : l10n.navAccount,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(Iterable<Stream<dynamic>> streams) {
    _subscriptions = streams
        .map((stream) => stream.listen((_) => notifyListeners()))
        .toList(growable: false);
  }

  late final List<StreamSubscription<dynamic>> _subscriptions;

  @override
  void dispose() {
    for (final subscription in _subscriptions) {
      subscription.cancel();
    }
    super.dispose();
  }
}
