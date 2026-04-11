import 'package:app_core/app_core.dart';

import '../entities/auth_session.dart';
import '../repositories/auth_repository.dart';

class RestoreAuthSessionUseCase
    implements UseCase<AuthSession?, RestoreAuthSessionParams> {
  const RestoreAuthSessionUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<AuthSession?>> call(RestoreAuthSessionParams params) {
    return _repository.restoreSession();
  }
}

class RestoreAuthSessionParams {
  const RestoreAuthSessionParams();
}
