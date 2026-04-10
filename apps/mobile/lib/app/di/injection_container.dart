import "package:app_logger/app_logger.dart";
import "package:app_storage/app_storage.dart";
import "package:get_it/get_it.dart";

import "../../features/auth/feature_auth.dart";
import "../../features/onboarding/feature_onboarding.dart";
import "../../features/orders/feature_orders.dart";
import "../config/app_config.dart";
import "../router/app_router.dart";
import "modules/app_core_module.dart";
import "modules/dependency_module.dart";
import "modules/router_module.dart";

final GetIt getIt = GetIt.instance;

/// Configure app dependencies and cross-module wiring.
///
/// Also wires auth state changes into APIService headers and auth guards.
Future<void> configureDependencies({
  required AppConfig appConfig,
  required AppLogger appLogger,
}) async {
  if (getIt.isRegistered<AppRouter>()) {
    return;
  }

  final sharedPreferencesService = await SharedPreferencesService.create();

  final modules = <DependencyModule>[
    AppCoreModule(
      appConfig: appConfig,
      appLogger: appLogger,
      sharedPreferencesService: sharedPreferencesService,
    ),
    const AuthModule(),
    const OnboardingModule(),
    const OrdersModule(),
    const RouterModule(),
    // more module registration here
  ];

  for (final module in modules) {
    await module.register(getIt);
  }

  if (getIt.isRegistered<AuthBloc>()) {
    getIt<AuthBloc>().add(const AuthStarted());
  }

  if (getIt.isRegistered<OnboardingBloc>()) {
    getIt<OnboardingBloc>().add(const OnboardingStarted());
  }
}

/// Seed local sample data when enabled via [AppConfig].
Future<void> seedLocalSampleData() async {
  if (!getIt.isRegistered<AppConfig>()) {
    return;
  }

  // final appConfig = getIt<AppConfig>();
  // if (!appConfig.enableSampleSeedData) {
  //   return;
  // }

  // No sample data seeding required for now.
}
