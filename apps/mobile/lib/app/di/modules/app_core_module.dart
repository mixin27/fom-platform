import "package:app_database/app_database.dart";
import "package:app_device/app_device.dart";
import "package:app_logger/app_logger.dart";
import "package:app_network/app_network.dart";
import "package:app_push/app_push.dart";
import "package:app_realtime/app_realtime.dart";
import "package:app_storage/app_storage.dart";
import "package:get_it/get_it.dart";

import "../../config/app_config.dart";
import "../../config/app_locale_controller.dart";
import "../../session/session_expiry_notifier.dart";
import "dependency_module.dart";
import "get_it_extensions.dart";

/// Dependency injection module for App Core.
///
/// Include:
/// - AppConfig
/// - AppLogger
/// - SharedPreferencesService
/// - SecureStorageService
/// - NetworkConfig
/// - Dio
/// - ApiClient
/// - NetworkConnectionService
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
  static const String _cachedUserKey = "auth.cached_user";
  static const String _selectedShopIdKey = "auth.selected_shop_id";

  @override
  void register(GetIt getIt) {
    final networkConfig = NetworkConfig(
      baseUrl: _normalizeApiBaseUrl(appConfig.apiBaseUrl),
    );
    final refreshDio = DioFactory.create(
      config: networkConfig,
      enableDebugLogs: false,
    );

    getIt
      ..putSingletonIfAbsent<AppConfig>(appConfig)
      ..putSingletonIfAbsent<AppLogger>(appLogger)
      ..putSingletonIfAbsent<SharedPreferencesService>(sharedPreferencesService)
      ..putSingletonIfAbsent<NetworkConfig>(networkConfig)
      ..putLazySingletonIfAbsent<SessionExpiryNotifier>(
        SessionExpiryNotifier.new,
      )
      ..putSingletonIfAbsent<AppLocaleController>(
        AppLocaleController(sharedPreferencesService),
      )
      ..putLazySingletonIfAbsent<SecureStorageService>(
        FlutterSecureStorageService.new,
      )
      ..putLazySingletonIfAbsent<AuthTokenStore>(
        () => SecureAuthTokenStore(getIt<SecureStorageService>()),
      )
      ..putLazySingletonIfAbsent<Dio>(
        () => DioFactory.create(
          config: getIt<NetworkConfig>(),
          authTokenStore: getIt<AuthTokenStore>(),
          refreshTokens: (refreshToken) => _refreshTokens(
            refreshDio: refreshDio,
            refreshToken: refreshToken,
            appLogger: appLogger,
          ),
          onSessionExpired: () async {
            await getIt<AuthTokenStore>().clearTokens();
            await getIt<SharedPreferencesService>().remove(_cachedUserKey);
            await getIt<SharedPreferencesService>().remove(_selectedShopIdKey);
            getIt<SessionExpiryNotifier>().notifyExpired();
          },
          enableDebugLogs: appConfig.isDevelopment,
        ),
      )
      ..putLazySingletonIfAbsent<ApiClient>(() => ApiClient(getIt<Dio>()))
      ..putLazySingletonIfAbsent<AppRealtimeService>(
        () => AppRealtimeService(
          getIt<ApiClient>(),
          getIt<NetworkConfig>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<NetworkConnectionService>(
        NetworkConnectionService.new,
      )
      ..putLazySingletonIfAbsent<DeviceMetadataService>(
        () => PlatformDeviceMetadataService(
          secureStorageService: getIt<SecureStorageService>(),
        ),
      )
      ..putLazySingletonIfAbsent<PushTokenProvider>(NoopPushTokenProvider.new)
      ..putLazySingletonIfAbsent<PushRegistrationService>(
        () => PushRegistrationService(
          getIt<ApiClient>(),
          getIt<DeviceMetadataService>(),
          getIt<PushTokenProvider>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<AppDatabase>(() => AppDatabase());
  }

  Future<AuthTokens?> _refreshTokens({
    required Dio refreshDio,
    required String refreshToken,
    required AppLogger appLogger,
  }) async {
    final normalizedRefreshToken = refreshToken.trim();
    if (normalizedRefreshToken.isEmpty) {
      return null;
    }

    try {
      final response = await refreshDio.post<dynamic>(
        "/auth/refresh",
        data: <String, dynamic>{"refresh_token": normalizedRefreshToken},
      );

      final statusCode = response.statusCode;
      if (statusCode == null || statusCode < 200 || statusCode >= 300) {
        return null;
      }

      final payload = _unwrapData(response.data);
      if (payload is! Map) {
        return null;
      }

      final mapPayload = Map<String, dynamic>.from(payload);
      final accessToken = _asString(mapPayload["access_token"]);
      final rotatedRefreshToken = _asString(mapPayload["refresh_token"]);
      if (accessToken.isEmpty || rotatedRefreshToken.isEmpty) {
        return null;
      }

      return AuthTokens(
        accessToken: accessToken,
        refreshToken: rotatedRefreshToken,
      );
    } on Object catch (error, stackTrace) {
      appLogger.warning("Auth token refresh failed: $error");
      appLogger.error(
        "Auth token refresh stack trace",
        error: error,
        stackTrace: stackTrace,
      );
      return null;
    }
  }

  dynamic _unwrapData(dynamic payload) {
    if (payload is Map<String, dynamic> && payload.containsKey("data")) {
      return payload["data"];
    }

    if (payload is Map && payload.containsKey("data")) {
      final mapPayload = Map<String, dynamic>.from(payload);
      return mapPayload["data"];
    }

    return payload;
  }

  String _asString(dynamic value) {
    if (value == null) {
      return "";
    }

    return value.toString().trim();
  }

  String _normalizeApiBaseUrl(String rawBaseUrl) {
    final trimmed = rawBaseUrl.trim();
    if (trimmed.isEmpty) {
      return trimmed;
    }

    final withoutTrailingSlash = trimmed.endsWith("/")
        ? trimmed.substring(0, trimmed.length - 1)
        : trimmed;

    if (withoutTrailingSlash.endsWith("/api/v1")) {
      return withoutTrailingSlash;
    }

    if (withoutTrailingSlash.endsWith("/api/mobile")) {
      return "${withoutTrailingSlash.substring(0, withoutTrailingSlash.length - "/mobile".length)}/v1";
    }

    if (withoutTrailingSlash.endsWith("/api")) {
      return "$withoutTrailingSlash/v1";
    }

    return withoutTrailingSlash;
  }
}
