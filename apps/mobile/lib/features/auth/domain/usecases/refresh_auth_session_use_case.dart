import 'package:app_core/app_core.dart';
import 'package:equatable/equatable.dart';

import '../entities/auth_session.dart';
import '../repositories/auth_repository.dart';

class RefreshAuthSessionUseCase
    implements UseCase<AuthSession, RefreshAuthSessionParams> {
  const RefreshAuthSessionUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<AuthSession>> call(RefreshAuthSessionParams params) {
    return _repository.refreshSession(refreshToken: params.refreshToken);
  }
}

class RefreshAuthSessionParams extends Equatable {
  const RefreshAuthSessionParams({required this.refreshToken});

  final String refreshToken;

  @override
  List<Object?> get props => <Object?>[refreshToken];
}
