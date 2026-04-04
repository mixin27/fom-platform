import "package:app_database/app_database.dart";
import "package:app_device/app_device.dart";
import "package:app_logger/app_logger.dart";
import "package:app_storage/app_storage.dart";
import "package:get_it/get_it.dart";

import "../../config/app_config.dart";
import "../../config/app_locale_controller.dart";
import "dependency_module.dart";
import "get_it_extensions.dart";

/// Dependency injection module for App Core.
///
/// Include:
/// - AppConfig
/// - AppLogger
/// - SharedPreferencesService
/// - SecureStorageService
/// - DeviceMetadataService
/// - AppDatabase
class AppCoreModule implements DependencyModule {
  const AppCoreModule({
    required this.appConfig,
    required this.appLogger,
    required this.sharedPreferencesService,
  });

  final AppConfig appConfig;
  final AppLogger appLogger;
  final SharedPreferencesService sharedPreferencesService;

  @override
  void register(GetIt getIt) {
    getIt
      ..putSingletonIfAbsent<AppConfig>(appConfig)
      ..putSingletonIfAbsent<AppLogger>(appLogger)
      ..putSingletonIfAbsent<SharedPreferencesService>(sharedPreferencesService)
      ..putSingletonIfAbsent<AppLocaleController>(
        AppLocaleController(sharedPreferencesService),
      )
      ..putLazySingletonIfAbsent<SecureStorageService>(
        FlutterSecureStorageService.new,
      )
      ..putLazySingletonIfAbsent<DeviceMetadataService>(
        () => PlatformDeviceMetadataService(
          secureStorageService: getIt<SecureStorageService>(),
        ),
      )
      ..putLazySingletonIfAbsent<AppDatabase>(() => AppDatabase());
  }
}
