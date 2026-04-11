import 'package:app_core/app_core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fom_mobile/features/auth/domain/entities/auth_access.dart';
import 'package:fom_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:fom_mobile/features/auth/domain/entities/auth_user.dart';
import 'package:fom_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:fom_mobile/features/auth/domain/usecases/login_use_case.dart';
import 'package:fom_mobile/features/auth/domain/usecases/logout_use_case.dart';
import 'package:fom_mobile/features/auth/domain/usecases/register_use_case.dart';
import 'package:fom_mobile/features/auth/domain/usecases/restore_auth_session_use_case.dart';
import 'package:fom_mobile/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:fom_mobile/features/auth/presentation/bloc/auth_event.dart';
import 'package:fom_mobile/features/auth/presentation/bloc/auth_state.dart';

void main() {
  group('AuthBloc', () {
    test('AuthStarted emits unauthenticated when no session exists', () async {
      final repository = _FakeAuthRepository(
        restoreResult: Result<AuthSession?>.success(null),
      );
      final bloc = _buildBloc(repository);

      final expectation = expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AuthState>().having(
            (state) => state.status,
            'status',
            AuthStatus.unauthenticated,
          ),
        ]),
      );

      bloc.add(const AuthStarted());
      await expectation;
      await bloc.close();
    });

    test('AuthLoginSubmitted emits submitting then authenticated', () async {
      final session = _fakeSession();
      final repository = _FakeAuthRepository(
        restoreResult: Result<AuthSession?>.success(null),
        loginResult: Result<AuthSession>.success(session),
      );
      final bloc = _buildBloc(repository);

      final expectation = expectLater(
        bloc.stream,
        emitsInOrder([
          isA<AuthState>().having(
            (state) => state.isSubmitting,
            'isSubmitting',
            true,
          ),
          isA<AuthState>()
              .having(
                (state) => state.status,
                'status',
                AuthStatus.authenticated,
              )
              .having((state) => state.user?.id, 'user.id', 'usr_1')
              .having((state) => state.isSubmitting, 'isSubmitting', false),
        ]),
      );

      bloc.add(
        const AuthLoginSubmitted(
          email: 'maaye@example.com',
          password: 'Password123!',
        ),
      );
      await expectation;
      await bloc.close();
    });
  });
}

AuthBloc _buildBloc(_FakeAuthRepository repository) {
  return AuthBloc(
    restoreAuthSessionUseCase: RestoreAuthSessionUseCase(repository),
    loginUseCase: LoginUseCase(repository),
    registerUseCase: RegisterUseCase(repository),
    logoutUseCase: LogoutUseCase(repository),
  );
}

class _FakeAuthRepository implements AuthRepository {
  _FakeAuthRepository({
    Result<AuthSession?>? restoreResult,
    Result<AuthSession>? loginResult,
    Result<AuthSession>? registerResult,
    Result<AuthSession>? refreshResult,
    Result<void>? logoutResult,
  }) : _restoreResult = restoreResult ?? Result<AuthSession?>.success(null),
       _loginResult =
           loginResult ?? Result<AuthSession>.success(_fakeSession()),
       _registerResult =
           registerResult ?? Result<AuthSession>.success(_fakeSession()),
       _refreshResult =
           refreshResult ?? Result<AuthSession>.success(_fakeSession()),
       _logoutResult = logoutResult ?? Result<void>.success(null);

  final Result<AuthSession?> _restoreResult;
  final Result<AuthSession> _loginResult;
  final Result<AuthSession> _registerResult;
  final Result<AuthSession> _refreshResult;
  final Result<void> _logoutResult;

  @override
  Future<Result<AuthSession>> login({
    required String email,
    required String password,
  }) async {
    return _loginResult;
  }

  @override
  Future<Result<void>> logout() async {
    return _logoutResult;
  }

  @override
  Future<Result<AuthSession>> refreshSession({
    required String refreshToken,
  }) async {
    return _refreshResult;
  }

  @override
  Future<Result<AuthSession>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? locale,
  }) async {
    return _registerResult;
  }

  @override
  Future<Result<AuthSession?>> restoreSession() async {
    return _restoreResult;
  }
}

AuthSession _fakeSession() {
  return const AuthSession(
    user: AuthUser(
      id: 'usr_1',
      name: 'Ma Aye',
      email: 'maaye@example.com',
      phone: '09 7800 1111',
      locale: 'my',
      platformAccess: AuthPlatformAccess(
        role: 'platform_owner',
        roles: <String>['platform_owner'],
        permissions: <String>['platform.shops.read'],
      ),
      shopAccesses: <AuthShopAccess>[
        AuthShopAccess(
          shopId: 'shop_1',
          role: 'owner',
          roles: <String>['owner'],
          permissions: <String>['orders.read'],
        ),
      ],
    ),
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    accessExpiresAt: null,
    refreshExpiresAt: null,
  );
}
