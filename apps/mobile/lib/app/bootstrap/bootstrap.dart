import "dart:async";

import "package:app_device/app_device.dart";
import "package:app_logger/app_logger.dart";
import "package:flutter/foundation.dart";
import "package:flutter/widgets.dart";

import "../config/app_config.dart";
import "../config/app_environment.dart";
import "../di/injection_container.dart";
import "startup_logger.dart";
import "startup_runner.dart";
import "startup_task.dart";

/// Executes bootstrap.
Future<void> bootstrap(
  /// Executes function.
  FutureOr<Widget> Function() builder, {
  AppEnvironment? environmentOverride,
}) async {
  final appConfig = AppConfig.fromEnvironment(
    environmentOverride: environmentOverride,
  );
  final appLogger = AppLogger(logLevel: appConfig.logLevel);
  final logger = StartupLogger(
    enabled: appConfig.enableVerboseStartupLogs,
    logger: appLogger,
  );

  await runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();

      _configureFrameworkErrorHooks(logger);

      final startupRunner = StartupRunner(logger);
      final startupTasks = _buildStartupTasks(appConfig, appLogger);

      await startupRunner.runCritical(startupTasks);

      runApp(await builder());
      unawaited(startupRunner.runDeferred(startupTasks));
    },
    (error, stackTrace) {
      logger.error("Unhandled zone error", error, stackTrace);

      if (!kReleaseMode) {
        FlutterError.presentError(
          FlutterErrorDetails(
            exception: error,
            stack: stackTrace,
            context: ErrorDescription("Unhandled error in app bootstrap zone"),
          ),
        );
      }
    },
  );
}

List<StartupTask> _buildStartupTasks(AppConfig config, AppLogger appLogger) {
  return <StartupTask>[
    StartupTask(
      name: "configure_dependencies",
      operation: () =>
          configureDependencies(appConfig: config, appLogger: appLogger),
    ),
    StartupTask(
      name: "bootstrap_device_metadata",
      operation: () async {
        if (!getIt.isRegistered<DeviceMetadataService>()) {
          return;
        }

        await getIt<DeviceMetadataService>().warmUp();
      },
    ),
  ];
}

void _configureFrameworkErrorHooks(StartupLogger logger) {
  FlutterError.onError = (details) {
    FlutterError.presentError(details);

    final stackTrace = details.stack ?? StackTrace.current;
    logger.error("Flutter framework error", details.exception, stackTrace);
  };

  PlatformDispatcher.instance.onError = (error, stackTrace) {
    logger.error("Platform dispatcher error", error, stackTrace);
    return kReleaseMode;
  };
}
