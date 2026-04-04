import "package:envied/envied.dart";

part "app_envied.g.dart";

@Envied(path: ".env", requireEnvFile: false)
abstract final class AppEnvied {
  @EnviedField(varName: "APP_ENV", defaultValue: "")
  static const String appEnv = _AppEnvied.appEnv;

  @EnviedField(varName: "API_BASE_URL", defaultValue: "", obfuscate: true)
  static final String apiBaseUrl = _AppEnvied.apiBaseUrl;

  @EnviedField(varName: "ENABLE_VERBOSE_STARTUP_LOGS", defaultValue: "")
  static const String enableVerboseStartupLogs =
      _AppEnvied.enableVerboseStartupLogs;

  @EnviedField(varName: "LOG_LEVEL", defaultValue: "")
  static const String logLevel = _AppEnvied.logLevel;
}

@Envied(path: ".env.development", requireEnvFile: false)
abstract final class AppEnviedDevelopment {
  @EnviedField(varName: "APP_ENV", defaultValue: "")
  static const String appEnv = _AppEnviedDevelopment.appEnv;

  @EnviedField(varName: "API_BASE_URL", defaultValue: "", obfuscate: true)
  static final String apiBaseUrl = _AppEnviedDevelopment.apiBaseUrl;

  @EnviedField(varName: "ENABLE_VERBOSE_STARTUP_LOGS", defaultValue: "")
  static const String enableVerboseStartupLogs =
      _AppEnviedDevelopment.enableVerboseStartupLogs;

  @EnviedField(varName: "LOG_LEVEL", defaultValue: "")
  static const String logLevel = _AppEnviedDevelopment.logLevel;
}

@Envied(path: ".env.staging", requireEnvFile: false)
abstract final class AppEnviedStaging {
  @EnviedField(varName: "APP_ENV", defaultValue: "")
  static const String appEnv = _AppEnviedStaging.appEnv;

  @EnviedField(varName: "API_BASE_URL", defaultValue: "", obfuscate: true)
  static final String apiBaseUrl = _AppEnviedStaging.apiBaseUrl;

  @EnviedField(varName: "ENABLE_VERBOSE_STARTUP_LOGS", defaultValue: "")
  static const String enableVerboseStartupLogs =
      _AppEnviedStaging.enableVerboseStartupLogs;

  @EnviedField(varName: "LOG_LEVEL", defaultValue: "")
  static const String logLevel = _AppEnviedStaging.logLevel;
}

@Envied(path: ".env.production", requireEnvFile: false)
abstract final class AppEnviedProduction {
  @EnviedField(varName: "APP_ENV", defaultValue: "")
  static const String appEnv = _AppEnviedProduction.appEnv;

  @EnviedField(varName: "API_BASE_URL", defaultValue: "", obfuscate: true)
  static final String apiBaseUrl = _AppEnviedProduction.apiBaseUrl;

  @EnviedField(varName: "ENABLE_VERBOSE_STARTUP_LOGS", defaultValue: "")
  static const String enableVerboseStartupLogs =
      _AppEnviedProduction.enableVerboseStartupLogs;

  @EnviedField(varName: "LOG_LEVEL", defaultValue: "")
  static const String logLevel = _AppEnviedProduction.logLevel;
}
