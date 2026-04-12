import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';
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
    AppLogger? logger,
  }) : _restoreAuthSessionUseCase = restoreAuthSessionUseCase,
       _loginUseCase = loginUseCase,
       _registerUseCase = registerUseCase,
       _logoutUseCase = logoutUseCase,
       _readSelectedShopUseCase = readSelectedShopUseCase,
       _saveSelectedShopUseCase = saveSelectedShopUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const AuthState()) {
    on<AuthStarted>(_onStarted);
    on<AuthLoginSubmitted>(_onLoginSubmitted);
    on<AuthRegisterSubmitted>(_onRegisterSubmitted);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthShopSelected>(_onShopSelected);
    on<AuthErrorDismissed>(_onErrorDismissed);
  }

  final RestoreAuthSessionUseCase _restoreAuthSessionUseCase;
  final LoginUseCase _loginUseCase;
  final RegisterUseCase _registerUseCase;
  final LogoutUseCase _logoutUseCase;
  final ReadSelectedShopUseCase _readSelectedShopUseCase;
  final SaveSelectedShopUseCase _saveSelectedShopUseCase;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('AuthBloc');

  Future<void> _onStarted(AuthStarted event, Emitter<AuthState> emit) async {
    if (state.status != AuthStatus.unknown) {
      return;
    }

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
      ),
    );
  }

  Future<void> _onLoginSubmitted(
    AuthLoginSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(isSubmitting: true, clearError: true));

    final result = await _loginUseCase(
      LoginParams(email: event.email, password: event.password),
    );

    final failure = result.failureOrNull;
    if (failure != null) {
      emit(
        state.copyWith(
          status: AuthStatus.unauthenticated,
          isSubmitting: false,
          errorMessage: failure.message,
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
          errorMessage: 'Login did not return a valid session.',
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
      ),
    );
  }

  Future<void> _onRegisterSubmitted(
    AuthRegisterSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(isSubmitting: true, clearError: true));

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
      ),
    );
  }

  Future<void> _onLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(isSubmitting: true, clearError: true));

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
        ),
      );
      return;
    }

    final saveResult = await _saveSelectedShopUseCase(
      SaveSelectedShopParams(shopId: shopId),
    );
    final failure = saveResult.failureOrNull;

    if (failure != null) {
      emit(state.copyWith(errorMessage: failure.message));
      return;
    }

    emit(state.copyWith(activeShopId: shopId, clearError: true));
  }

  void _onErrorDismissed(AuthErrorDismissed event, Emitter<AuthState> emit) {
    emit(state.copyWith(clearError: true));
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
