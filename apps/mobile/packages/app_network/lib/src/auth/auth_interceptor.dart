import 'dart:async';

import 'package:dio/dio.dart';

import 'auth_token_store.dart';
import 'auth_tokens.dart';
import 'network_request_flags.dart';

typedef RefreshTokensDelegate =
    Future<AuthTokens?> Function(String refreshToken);

class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required Dio dio,
    required AuthTokenStore tokenStore,
    this.refreshTokens,
    this.onSessionExpired,
    Set<int>? unauthorizedStatusCodes,
  }) : _dio = dio,
       _tokenStore = tokenStore,
       _unauthorizedStatusCodes = unauthorizedStatusCodes ?? const <int>{401};

  final Dio _dio;
  final AuthTokenStore _tokenStore;
  final RefreshTokensDelegate? refreshTokens;
  final Future<void> Function()? onSessionExpired;
  final Set<int> _unauthorizedStatusCodes;

  Completer<AuthTokens?>? _refreshCompleter;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final shouldSkipAuth = options.extra[NetworkRequestFlags.skipAuth] == true;
    if (shouldSkipAuth) {
      handler.next(options);
      return;
    }

    final accessToken = await _tokenStore.readAccessToken();
    if (accessToken != null && accessToken.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final requestOptions = err.requestOptions;
    final shouldSkipAuth =
        requestOptions.extra[NetworkRequestFlags.skipAuth] == true;
    final hasRetried =
        requestOptions.extra[NetworkRequestFlags.retriedWithFreshToken] == true;
    final statusCode = err.response?.statusCode;
    final canHandleUnauthorized =
        statusCode != null && _unauthorizedStatusCodes.contains(statusCode);

    if (shouldSkipAuth ||
        hasRetried ||
        !canHandleUnauthorized ||
        refreshTokens == null) {
      handler.next(err);
      return;
    }

    final refreshToken = await _tokenStore.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      await _expireSession();
      handler.next(err);
      return;
    }

    final refreshedTokens = await _refreshOnce(refreshToken);
    if (refreshedTokens == null) {
      await _expireSession();
      handler.next(err);
      return;
    }

    await _tokenStore.saveTokens(refreshedTokens);

    final retriedRequestOptions = _buildRetriedRequestOptions(
      requestOptions,
      refreshedTokens.accessToken,
    );

    try {
      final response = await _dio.fetch<dynamic>(retriedRequestOptions);
      handler.resolve(response);
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }

  Future<AuthTokens?> _refreshOnce(String refreshToken) async {
    final activeCompleter = _refreshCompleter;
    if (activeCompleter != null) {
      return activeCompleter.future;
    }

    final completer = Completer<AuthTokens?>();
    _refreshCompleter = completer;

    try {
      final refreshedTokens = await refreshTokens!(refreshToken);
      completer.complete(refreshedTokens);
    } catch (_) {
      completer.complete(null);
    } finally {
      _refreshCompleter = null;
    }

    return completer.future;
  }

  RequestOptions _buildRetriedRequestOptions(
    RequestOptions original,
    String accessToken,
  ) {
    final headers = Map<String, dynamic>.from(original.headers)
      ..['Authorization'] = 'Bearer $accessToken';
    final extra = Map<String, dynamic>.from(original.extra)
      ..[NetworkRequestFlags.retriedWithFreshToken] = true;

    return original.copyWith(headers: headers, extra: extra);
  }

  Future<void> _expireSession() async {
    await _tokenStore.clearTokens();
    await onSessionExpired?.call();
  }
}
