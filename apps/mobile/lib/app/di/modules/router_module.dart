import "package:app_logger/app_logger.dart";
import "package:get_it/get_it.dart";

import "../../config/app_config.dart";
import "../../router/app_router.dart";
import "dependency_module.dart";
import "get_it_extensions.dart";

/// Dependency injection module for Router.
class RouterModule implements DependencyModule {
  const RouterModule();

  @override
  void register(GetIt getIt) {
    final appConfig = getIt<AppConfig>();

    getIt.putLazySingletonIfAbsent<AppRouter>(
      () => AppRouter(
        appLogger: getIt<AppLogger>(),
        enableLogDevTools: appConfig.isDevelopment,
      ),
    );
  }
}
