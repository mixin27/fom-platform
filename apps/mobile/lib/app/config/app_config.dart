import 'package:app_env/app_env.dart';
import "package:equatable/equatable.dart";

import "app_environment.dart";

/// Configuration for App.
class AppConfig extends Equatable {
  const AppConfig({
    required this.environment,
    required this.apiBaseUrl,
    required this.enableVerboseStartupLogs,
    required this.logLevel,
  });

  factory AppConfig.fromEnvironment({AppEnvironment? environmentOverride}) {
    final appEnvDefineValue = const bool.hasEnvironment("APP_ENV")
        ? const String.fromEnvironment("APP_ENV")
        : null;
    final environment =
        environmentOverride ??
        AppEnvironment.fromString(
          _resolveString(
            defineValue: appEnvDefineValue,
            enviedValue: AppEnvied.appEnv,
            defaultValue: "production",
          ),
        );

    final enviedValues = _enviedValuesFor(environment);
    final apiBaseUrl = _resolveString(
      defineValue: const bool.hasEnvironment("API_BASE_URL")
          ? const String.fromEnvironment("API_BASE_URL")
          : null,
      enviedValue: enviedValues.apiBaseUrl,
      defaultValue: _defaultBaseUrlFor(environment),
    );

    final enableVerboseStartupLogs = _resolveBool(
      defineValue: const bool.hasEnvironment("ENABLE_VERBOSE_STARTUP_LOGS")
          ? const bool.fromEnvironment("ENABLE_VERBOSE_STARTUP_LOGS")
          : null,
      enviedValue: enviedValues.enableVerboseStartupLogs,
      defaultValue: environment != AppEnvironment.production,
    );

    final logLevel = _resolveString(
      defineValue: const bool.hasEnvironment("LOG_LEVEL")
          ? const String.fromEnvironment("LOG_LEVEL")
          : null,
      enviedValue: enviedValues.logLevel,
      defaultValue: _defaultLogLevelFor(environment),
    );

    return AppConfig(
      environment: environment,
      apiBaseUrl: apiBaseUrl,
      enableVerboseStartupLogs: enableVerboseStartupLogs,
      logLevel: logLevel,
    );
  }

  final AppEnvironment environment;
  final String apiBaseUrl;
  final bool enableVerboseStartupLogs;
  final String logLevel;

  bool get isDevelopment => environment == AppEnvironment.development;

  bool get isProduction => environment == AppEnvironment.production;

  @override
  List<Object?> get props => [
    environment,
    apiBaseUrl,
    enableVerboseStartupLogs,
    logLevel,
  ];

  static String _defaultBaseUrlFor(AppEnvironment environment) {
    switch (environment) {
      case AppEnvironment.development:
        return "http://localhost:4000/api/v1";
      case AppEnvironment.staging:
        return "http://localhost:4000/api/v1";
      case AppEnvironment.production:
        return "http://localhost:4000/api/v1";
    }
  }

  static String _defaultLogLevelFor(AppEnvironment environment) {
    switch (environment) {
      case AppEnvironment.development:
        return "debug";
      case AppEnvironment.staging:
        return "info";
      case AppEnvironment.production:
        return "warning";
    }
  }

  static _EnviedValues _enviedValuesFor(AppEnvironment environment) {
    final fallback = _EnviedValues(
      appEnv: AppEnvied.appEnv,
      apiBaseUrl: AppEnvied.apiBaseUrl,
      enableVerboseStartupLogs: AppEnvied.enableVerboseStartupLogs,
      logLevel: AppEnvied.logLevel,
    );

    switch (environment) {
      case AppEnvironment.development:
        return _EnviedValues.merge(
          primary: _EnviedValues(
            appEnv: AppEnviedDevelopment.appEnv,
            apiBaseUrl: AppEnviedDevelopment.apiBaseUrl,
            enableVerboseStartupLogs:
                AppEnviedDevelopment.enableVerboseStartupLogs,
            logLevel: AppEnviedDevelopment.logLevel,
          ),
          fallback: fallback,
        );
      case AppEnvironment.staging:
        return _EnviedValues(
          appEnv: AppEnviedStaging.appEnv,
          apiBaseUrl: AppEnviedStaging.apiBaseUrl,
          enableVerboseStartupLogs: AppEnviedStaging.enableVerboseStartupLogs,
          logLevel: AppEnviedStaging.logLevel,
        );
      case AppEnvironment.production:
        return _EnviedValues(
          appEnv: AppEnviedProduction.appEnv,
          apiBaseUrl: AppEnviedProduction.apiBaseUrl,
          enableVerboseStartupLogs:
              AppEnviedProduction.enableVerboseStartupLogs,
          logLevel: AppEnviedProduction.logLevel,
        );
    }
  }

  static String _resolveString({
    required String? defineValue,
    required String enviedValue,
    required String defaultValue,
  }) {
    final defineCandidate = defineValue?.trim();
    if (defineCandidate != null && defineCandidate.isNotEmpty) {
      return defineCandidate;
    }

    final enviedCandidate = enviedValue.trim();
    if (enviedCandidate.isNotEmpty) {
      return enviedCandidate;
    }

    return defaultValue;
  }

  static bool _resolveBool({
    required bool? defineValue,
    required String enviedValue,
    required bool defaultValue,
  }) {
    if (defineValue != null) {
      return defineValue;
    }

    final enviedBool = _parseOptionalBool(enviedValue);
    if (enviedBool != null) {
      return enviedBool;
    }

    return defaultValue;
  }

  static bool? _parseOptionalBool(String rawValue) {
    final normalized = rawValue.trim().toLowerCase();
    switch (normalized) {
      case "1":
      case "true":
      case "yes":
      case "y":
      case "on":
        return true;
      case "0":
      case "false":
      case "no":
      case "n":
      case "off":
        return false;
      default:
        return null;
    }
  }
}

class _EnviedValues {
  const _EnviedValues({
    required this.appEnv,
    required this.apiBaseUrl,
    required this.enableVerboseStartupLogs,
    required this.logLevel,
  });

  final String appEnv;
  final String apiBaseUrl;
  final String enableVerboseStartupLogs;
  final String logLevel;

  static _EnviedValues merge({
    required _EnviedValues primary,
    required _EnviedValues fallback,
  }) {
    return _EnviedValues(
      appEnv: _pickEnviedValue(primary.appEnv, fallback.appEnv),
      apiBaseUrl: _pickEnviedValue(primary.apiBaseUrl, fallback.apiBaseUrl),
      enableVerboseStartupLogs: _pickEnviedValue(
        primary.enableVerboseStartupLogs,
        fallback.enableVerboseStartupLogs,
      ),
      logLevel: _pickEnviedValue(primary.logLevel, fallback.logLevel),
    );
  }

  static String _pickEnviedValue(String primary, String fallback) {
    final trimmedPrimary = primary.trim();
    if (trimmedPrimary.isNotEmpty) {
      return trimmedPrimary;
    }

    final trimmedFallback = fallback.trim();
    if (trimmedFallback.isNotEmpty) {
      return trimmedFallback;
    }

    return "";
  }
}
