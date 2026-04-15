import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';
import 'package:app_push/app_push.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/auth_session.dart';
import '../../domain/usecases/login_use_case.dart';
import '../../domain/usecases/logout_use_case.dart';
import '../../domain/usecases/read_selected_shop_use_case.dart';
import '../../domain/usecases/register_use_case.dart';
import '../../domain/usecases/restore_auth_session_use_case.dart';
import '../../domain/usecases/save_selected_shop_use_case.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> with LoggerMixin {
  AuthBloc({
    required RestoreAuthSessionUseCase restoreAuthSessionUseCase,
    required LoginUseCase loginUseCase,
    required RegisterUseCase registerUseCase,
    required LogoutUseCase logoutUseCase,
    required ReadSelectedShopUseCase readSelectedShopUseCase,
    required SaveSelectedShopUseCase saveSelectedShopUseCase,
    PushRegistrationService? pushRegistrationService,
    AppLogger? logger,
  }) : _restoreAuthSessionUseCase = restoreAuthSessionUseCase,
       _loginUseCase = loginUseCase,
       _registerUseCase = registerUseCase,
       _logoutUseCase = logoutUseCase,
       _readSelectedShopUseCase = readSelectedShopUseCase,
       _saveSelectedShopUseCase = saveSelectedShopUseCase,
       _pushRegistrationService = pushRegistrationService,
       _logger = logger ?? AppLogger(enabled: false),
       super(const AuthState()) {
    on<AuthStarted>(_onStarted);
    on<AuthLoginSubmitted>(_onLoginSubmitted);
    on<AuthLoginTakeoverRequested>(_onLoginTakeoverRequested);
    on<AuthRegisterSubmitted>(_onRegisterSubmitted);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthShopSelected>(_onShopSelected);
    on<AuthSessionRefreshRequested>(_onSessionRefreshRequested);
    on<AuthSessionExpiredDetected>(_onSessionExpiredDetected);
    on<AuthErrorDismissed>(_onErrorDismissed);
  }

  final RestoreAuthSessionUseCase _restoreAuthSessionUseCase;
  final LoginUseCase _loginUseCase;
  final RegisterUseCase _registerUseCase;
  final LogoutUseCase _logoutUseCase;
  final ReadSelectedShopUseCase _readSelectedShopUseCase;
  final SaveSelectedShopUseCase _saveSelectedShopUseCase;
  final PushRegistrationService? _pushRegistrationService;
  final AppLogger _logger;
  String? _pendingLoginEmail;
  String? _pendingLoginPassword;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('AuthBloc');

  Future<void> _onStarted(AuthStarted event, Emitter<AuthState> emit) async {
    if (state.status != AuthStatus.unknown) {
      return;
    }

    await _restoreSessionAndEmit(emit);
  }

  Future<void> _onSessionRefreshRequested(
    AuthSessionRefreshRequested event,
    Emitter<AuthState> emit,
  ) async {
    if (state.session == null) {
      return;
    }

    await _restoreSessionAndEmit(emit);
  }

  void _onSessionExpiredDetected(
    AuthSessionExpiredDetected event,
    Emitter<AuthState> emit,
  ) {
    emit(
      state.copyWith(
        status: AuthStatus.unauthenticated,
        isSubmitting: false,
        removeSession: true,
        removeActiveShop: true,
        errorMessage: 'Your session ended. Please sign in again.',
        clearSessionConflict: true,
      ),
    );
  }

  Future<void> _restoreSessionAndEmit(Emitter<AuthState> emit) async {
    final result = await _restoreAuthSessionUseCase(
      const RestoreAuthSessionParams(),
    );

    final failure = result.failureOrNull;
    if (failure != null) {
      log.warning('Session restore failed: ${failure.message}');
      emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          removeSession: true,
          removeActiveShop: true,
          errorMessage: failure.message,
          clearSessionConflict: true,
        ),
      );
      return;
    }

    final session = result.dataOrNull;
    if (session == null) {
      emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          removeSession: true,
          removeActiveShop: true,
          clearError: true,
          clearSessionConflict: true,
        ),
      );
      return;
    }

    final activeShopId = await _resolveActiveShopId(session);
    emit(
      state.copyWith(
        status: AuthStatus.authenticated,
        session: session,
        activeShopId: activeShopId,
        isSubmitting: false,
        clearError: true,
        clearSessionConflict: true,
      ),
    );
  }

  Future<void> _onLoginSubmitted(
    AuthLoginSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    await _submitLogin(
      email: event.email,
      password: event.password,
      logoutOtherDevice: false,
      emit: emit,
    );
  }

  Future<void> _onLoginTakeoverRequested(
    AuthLoginTakeoverRequested event,
    Emitter<AuthState> emit,
  ) async {
    final email = _pendingLoginEmail?.trim() ?? '';
    final password = _pendingLoginPassword ?? '';

    if (email.isEmpty || password.isEmpty) {
      emit(
        state.copyWith(
          errorMessage: 'Sign in again to continue on this device.',
          clearSessionConflict: true,
        ),
      );
      return;
    }

    await _submitLogin(
      email: email,
      password: password,
      logoutOtherDevice: true,
      emit: emit,
    );
  }

  Future<void> _onRegisterSubmitted(
    AuthRegisterSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(
      state.copyWith(
        isSubmitting: true,
        clearError: true,
        clearSessionConflict: true,
      ),
    );

    final result = await _registerUseCase(
      RegisterParams(
        name: event.name,
        email: event.email,
        password: event.password,
        phone: event.phone,
        locale: event.locale,
      ),
    );

    final failure = result.failureOrNull;
    if (failure != null) {
      emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          isSubmitting: false,
          errorMessage: failure.message,
          clearSessionConflict: true,
        ),
      );
      return;
    }

    final session = result.dataOrNull;
    if (session == null) {
      emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          isSubmitting: false,
          errorMessage: 'Registration did not return a valid session.',
          clearSessionConflict: true,
        ),
      );
      return;
    }

    final activeShopId = await _resolveActiveShopId(session);
    emit(
      state.copyWith(
        status: AuthStatus.authenticated,
        session: session,
        activeShopId: activeShopId,
        isSubmitting: false,
        clearError: true,
        clearSessionConflict: true,
      ),
    );
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(
      state.copyWith(
        isSubmitting: true,
        clearError: true,
        clearSessionConflict: true,
      ),
    );

    if (_pushRegistrationService != null) {
      try {
        await _pushRegistrationService.unregisterCurrentDevice();
      } catch (error, stackTrace) {
        log.warning('Push device unregister skipped during logout: $error');
        log.error(
          'Push device unregister failed during logout',
          error: error,
          stackTrace: stackTrace,
        );
      }
    }

    final result = await _logoutUseCase(const NoParams());

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: AuthStatus.unauthenticated,
            isSubmitting: false,
            removeSession: true,
            removeActiveShop: true,
            errorMessage: failure.message,
            clearSessionConflict: true,
          ),
        );
      },
      (_) {
        emit(
          state.copyWith(
            status: AuthStatus.unauthenticated,
            isSubmitting: false,
            removeSession: true,
            removeActiveShop: true,
            clearError: true,
            clearSessionConflict: true,
          ),
        );
      },
    );
  }

  Future<void> _onShopSelected(
    AuthShopSelected event,
    Emitter<AuthState> emit,
  ) async {
    final shopId = event.shopId.trim();
    final currentUser = state.user;

    if (currentUser == null || shopId.isEmpty) {
      return;
    }

    final matchingShop = currentUser.shopAccesses.any(
      (shop) => shop.shopId == shopId,
    );
    if (!matchingShop) {
      emit(
        state.copyWith(
          errorMessage: 'This shop is not available for the current account.',
          clearSessionConflict: true,
        ),
      );
      return;
    }

    final saveResult = await _saveSelectedShopUseCase(
      SaveSelectedShopParams(shopId: shopId),
    );
    final failure = saveResult.failureOrNull;

    if (failure != null) {
      emit(
        state.copyWith(
          errorMessage: failure.message,
          clearSessionConflict: true,
        ),
      );
      return;
    }

    emit(
      state.copyWith(
        activeShopId: shopId,
        clearError: true,
        clearSessionConflict: true,
      ),
    );
  }

  void _onErrorDismissed(AuthErrorDismissed event, Emitter<AuthState> emit) {
    emit(state.copyWith(clearError: true));
  }

  Future<void> _submitLogin({
    required String email,
    required String password,
    required bool logoutOtherDevice,
    required Emitter<AuthState> emit,
  }) async {
    emit(state.copyWith(isSubmitting: true, clearError: true));

    final result = await _loginUseCase(
      LoginParams(
        email: email,
        password: password,
        logoutOtherDevice: logoutOtherDevice,
      ),
    );

    final failure = result.failureOrNull;
    if (failure != null) {
      final sessionConflict = _resolveSessionConflict(failure);
      if (sessionConflict != null) {
        _pendingLoginEmail = email;
        _pendingLoginPassword = password;
        emit(
          state.copyWith(
            status: AuthStatus.unauthenticated,
            isSubmitting: false,
            clearError: true,
            sessionConflict: sessionConflict,
          ),
        );
        return;
      }

      _pendingLoginEmail = null;
      _pendingLoginPassword = null;
      emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          isSubmitting: false,
          errorMessage: failure.message,
          clearSessionConflict: true,
        ),
      );
      return;
    }

    final session = result.dataOrNull;
    if (session == null) {
      _pendingLoginEmail = null;
      _pendingLoginPassword = null;
      emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          isSubmitting: false,
          errorMessage: 'Login did not return a valid session.',
          clearSessionConflict: true,
        ),
      );
      return;
    }

    _pendingLoginEmail = null;
    _pendingLoginPassword = null;
    final activeShopId = await _resolveActiveShopId(session);
    emit(
      state.copyWith(
        status: AuthStatus.authenticated,
        session: session,
        activeShopId: activeShopId,
        isSubmitting: false,
        clearError: true,
        clearSessionConflict: true,
      ),
    );
  }

  AuthSessionConflict? _resolveSessionConflict(Failure failure) {
    if (failure is! ServerFailure ||
        failure.code != 'SESSION_ACTIVE_ON_ANOTHER_DEVICE') {
      return null;
    }

    final errorPayload = failure.payload?['error'];
    if (errorPayload is! Map) {
      return null;
    }

    final context = errorPayload['context'];
    if (context is! Map) {
      return null;
    }

    final sessionConflict = context['session_conflict'];
    if (sessionConflict is! Map) {
      return null;
    }

    final activeSession = sessionConflict['active_session'];
    final rawLastSeenAt = activeSession is Map
        ? activeSession['last_seen_at']?.toString().trim()
        : null;

    return AuthSessionConflict(
      platform:
          sessionConflict['platform']?.toString().trim().isNotEmpty == true
          ? sessionConflict['platform'].toString().trim()
          : 'unknown',
      activeSessionCount: switch (sessionConflict['active_session_count']) {
        final int count => count,
        final num count => count.toInt(),
        _ => 1,
      },
      deviceName:
          activeSession is Map &&
              activeSession['device_name']?.toString().trim().isNotEmpty == true
          ? activeSession['device_name'].toString().trim()
          : 'Another device',
      lastSeenAt: rawLastSeenAt == null || rawLastSeenAt.isEmpty
          ? null
          : DateTime.tryParse(rawLastSeenAt),
      ipAddress:
          activeSession is Map &&
              activeSession['ip_address']?.toString().trim().isNotEmpty == true
          ? activeSession['ip_address'].toString().trim()
          : null,
    );
  }

  Future<String?> _resolveActiveShopId(AuthSession session) async {
    final shops = session.user.shopAccesses;

    if (shops.isEmpty) {
      await _persistSelectedShopId(null);
      return null;
    }

    if (shops.length == 1) {
      final onlyShopId = shops.first.shopId;
      await _persistSelectedShopId(onlyShopId);
      return onlyShopId;
    }

    final persistedShopResult = await _readSelectedShopUseCase(
      const ReadSelectedShopParams(),
    );
    final persistedShopId = persistedShopResult.dataOrNull?.trim();

    if (persistedShopResult.failureOrNull != null) {
      log.warning(
        'Selected shop restore failed: ${persistedShopResult.failureOrNull!.message}',
      );
    }

    if (persistedShopId != null &&
        persistedShopId.isNotEmpty &&
        shops.any((shop) => shop.shopId == persistedShopId)) {
      return persistedShopId;
    }

    await _persistSelectedShopId(null);
    return null;
  }

  Future<void> _persistSelectedShopId(String? shopId) async {
    final result = await _saveSelectedShopUseCase(
      SaveSelectedShopParams(shopId: shopId),
    );

    if (result.failureOrNull != null) {
      log.warning(
        'Selected shop persistence failed: ${result.failureOrNull!.message}',
      );
    }
  }
}
