import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';
import 'package:dio/dio.dart';

import '../../domain/entities/auth_session.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_data_source.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/auth_session_model.dart';

class AuthRepositoryImpl with LoggerMixin implements AuthRepository {
  AuthRepositoryImpl(
    this._localDataSource,
    this._remoteDataSource, {
    AppLogger? logger,
  }) : _logger = logger ?? AppLogger(enabled: false);

  final AuthLocalDataSource _localDataSource;
  final AuthRemoteDataSource _remoteDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('AuthRepository');

  @override
  Future<Result<AuthSession>> login({
    required String email,
    required String password,
  }) {
    return _runSessionFlow(
      action: () => _remoteDataSource.login(email: email, password: password),
      actionLabel: 'login',
    );
  }

  @override
  Future<Result<void>> logout() async {
    try {
      try {
        await _remoteDataSource.logout();
      } catch (error, stackTrace) {
        log.warning('Remote logout failed, clearing local session');
        log.error('Remote logout error', error: error, stackTrace: stackTrace);
      }

      await _localDataSource.clearSession();
      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error('Logout failed', error: error, stackTrace: stackTrace);
      return Result<void>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<String?>> readSelectedShopId() async {
    try {
      final shopId = await _localDataSource.readSelectedShopId();
      return Result<String?>.success(shopId);
    } catch (error, stackTrace) {
      log.error(
        'Read selected shop failed',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<String?>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<AuthSession>> refreshSession({required String refreshToken}) {
    return _runSessionFlow(
      action: () => _remoteDataSource.refresh(refreshToken: refreshToken),
      actionLabel: 'refresh_session',
    );
  }

  @override
  Future<Result<AuthSession>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? locale,
  }) {
    return _runSessionFlow(
      action: () => _remoteDataSource.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
        locale: locale,
      ),
      actionLabel: 'register',
    );
  }

  @override
  Future<Result<AuthSession?>> restoreSession() async {
    try {
      final tokens = await _localDataSource.readTokens();
      final cachedUser = await _localDataSource.readCachedUser();

      if (tokens == null || tokens.refreshToken.trim().isEmpty) {
        await _localDataSource.clearSession();
        return Result<AuthSession?>.success(null);
      }

      try {
        final currentUser = await _remoteDataSource.getCurrentUser();
        await _localDataSource.saveCachedUser(currentUser);

        return Result<AuthSession?>.success(
          AuthSessionModel.fromStorage(user: currentUser, tokens: tokens),
        );
      } catch (error, stackTrace) {
        if (_isUnauthorized(error)) {
          log.warning('Access token expired, trying refresh flow');

          final refreshed = await _remoteDataSource.refresh(
            refreshToken: tokens.refreshToken,
          );
          await _localDataSource.saveSession(refreshed);
          return Result<AuthSession?>.success(refreshed);
        }

        if (_isNetworkRelated(error) && cachedUser != null) {
          log.warning('Using cached user because network is unavailable');
          return Result<AuthSession?>.success(
            AuthSessionModel.fromStorage(user: cachedUser, tokens: tokens),
          );
        }

        log.error(
          'Restore session failed',
          error: error,
          stackTrace: stackTrace,
        );
        await _localDataSource.clearSession();
        return Result<AuthSession?>.failure(FailureMapper.from(error));
      }
    } catch (error, stackTrace) {
      log.error(
        'Restore session crashed',
        error: error,
        stackTrace: stackTrace,
      );
      await _localDataSource.clearSession();
      return Result<AuthSession?>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<void>> saveSelectedShopId(String? shopId) async {
    try {
      await _localDataSource.saveSelectedShopId(shopId);
      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error(
        'Save selected shop failed',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<void>.failure(FailureMapper.from(error));
    }
  }

  Future<Result<AuthSession>> _runSessionFlow({
    required Future<AuthSessionModel> Function() action,
    required String actionLabel,
  }) async {
    try {
      final session = await action();
      await _localDataSource.saveSession(session);
      return Result<AuthSession>.success(session);
    } catch (error, stackTrace) {
      log.error(
        'Auth flow failed: $actionLabel',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<AuthSession>.failure(FailureMapper.from(error));
    }
  }

  bool _isNetworkRelated(Object error) {
    if (error is NetworkException) {
      return true;
    }

    if (error is DioException) {
      return error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.sendTimeout ||
          error.type == DioExceptionType.unknown;
    }

    return false;
  }

  bool _isUnauthorized(Object error) {
    if (error is ServerException) {
      return error.statusCode == 401;
    }

    if (error is DioException) {
      return error.response?.statusCode == 401;
    }

    return false;
  }
}
