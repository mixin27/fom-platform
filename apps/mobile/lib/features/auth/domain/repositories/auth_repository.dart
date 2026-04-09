import 'package:app_core/app_core.dart';

import '../entities/auth_session.dart';

abstract class AuthRepository {
  Future<Result<AuthSession>> login({
    required String email,
    required String password,
  });

  Future<Result<AuthSession>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? locale,
  });

  Future<Result<AuthSession?>> restoreSession();

  Future<Result<AuthSession>> refreshSession({required String refreshToken});

  Future<Result<void>> logout();
}
