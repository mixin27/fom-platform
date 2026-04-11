import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/login_use_case.dart';
import '../../domain/usecases/logout_use_case.dart';
import '../../domain/usecases/register_use_case.dart';
import '../../domain/usecases/restore_auth_session_use_case.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> with LoggerMixin {
  AuthBloc({
    required RestoreAuthSessionUseCase restoreAuthSessionUseCase,
    required LoginUseCase loginUseCase,
    required RegisterUseCase registerUseCase,
    required LogoutUseCase logoutUseCase,
    AppLogger? logger,
  }) : _restoreAuthSessionUseCase = restoreAuthSessionUseCase,
       _loginUseCase = loginUseCase,
       _registerUseCase = registerUseCase,
       _logoutUseCase = logoutUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const AuthState()) {
    on<AuthStarted>(_onStarted);
    on<AuthLoginSubmitted>(_onLoginSubmitted);
    on<AuthRegisterSubmitted>(_onRegisterSubmitted);
    on<AuthLogoutRequested>(_onLogoutRequested);
    on<AuthErrorDismissed>(_onErrorDismissed);
  }

  final RestoreAuthSessionUseCase _restoreAuthSessionUseCase;
  final LoginUseCase _loginUseCase;
  final RegisterUseCase _registerUseCase;
  final LogoutUseCase _logoutUseCase;
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

    result.fold(
      (failure) {
        log.warning('Session restore failed: ${failure.message}');
        emit(
          state.copyWith(
            status: AuthStatus.unauthenticated,
            removeSession: true,
            errorMessage: failure.message,
          ),
        );
      },
      (session) {
        if (session == null) {
          emit(
            state.copyWith(
              status: AuthStatus.unauthenticated,
              removeSession: true,
              clearError: true,
            ),
          );
          return;
        }

        emit(
          state.copyWith(
            status: AuthStatus.authenticated,
            session: session,
            clearError: true,
          ),
        );
      },
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

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: AuthStatus.unauthenticated,
            isSubmitting: false,
            errorMessage: failure.message,
          ),
        );
      },
      (session) {
        emit(
          state.copyWith(
            status: AuthStatus.authenticated,
            session: session,
            isSubmitting: false,
            clearError: true,
          ),
        );
      },
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

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: AuthStatus.unauthenticated,
            isSubmitting: false,
            errorMessage: failure.message,
          ),
        );
      },
      (session) {
        emit(
          state.copyWith(
            status: AuthStatus.authenticated,
            session: session,
            isSubmitting: false,
            clearError: true,
          ),
        );
      },
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
            clearError: true,
          ),
        );
      },
    );
  }

  void _onErrorDismissed(AuthErrorDismissed event, Emitter<AuthState> emit) {
    emit(state.copyWith(clearError: true));
  }
}
