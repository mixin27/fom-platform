import 'package:app_core/app_core.dart';
import 'package:equatable/equatable.dart';

import '../entities/auth_session.dart';
import '../repositories/auth_repository.dart';

class LoginUseCase implements UseCase<AuthSession, LoginParams> {
  const LoginUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<AuthSession>> call(LoginParams params) {
    return _repository.login(
      email: params.email,
      password: params.password,
      logoutOtherDevice: params.logoutOtherDevice,
    );
  }
}

class LoginParams extends Equatable {
  const LoginParams({
    required this.email,
    required this.password,
    this.logoutOtherDevice = false,
  });

  final String email;
  final String password;
  final bool logoutOtherDevice;

  @override
  List<Object?> get props => <Object?>[email, password, logoutOtherDevice];
}
