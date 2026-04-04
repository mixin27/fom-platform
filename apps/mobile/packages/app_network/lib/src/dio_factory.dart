import 'package:dio/dio.dart';

import 'auth/auth_interceptor.dart';
import 'auth/auth_token_store.dart';
import 'network_config.dart';

class DioFactory {
  const DioFactory._();

  static Dio create({
    required NetworkConfig config,
    AuthTokenStore? authTokenStore,
    RefreshTokensDelegate? refreshTokens,
    Future<void> Function()? onSessionExpired,
    bool enableDebugLogs = false,
  }) {
    final dio = Dio(
      BaseOptions(
        baseUrl: config.baseUrl,
        connectTimeout: config.connectTimeout,
        sendTimeout: config.sendTimeout,
        receiveTimeout: config.receiveTimeout,
        contentType: Headers.jsonContentType,
        responseType: ResponseType.json,
      ),
    );

    if (authTokenStore != null) {
      dio.interceptors.add(
        AuthInterceptor(
          dio: dio,
          tokenStore: authTokenStore,
          refreshTokens: refreshTokens,
          onSessionExpired: onSessionExpired,
        ),
      );
    }

    if (enableDebugLogs) {
      dio.interceptors.add(
        LogInterceptor(requestBody: false, responseBody: false),
      );
    }

    return dio;
  }
}
