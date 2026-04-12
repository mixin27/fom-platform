import 'package:app_core/app_core.dart';

import '../repositories/auth_repository.dart';

class ReadSelectedShopUseCase
    implements UseCase<String?, ReadSelectedShopParams> {
  const ReadSelectedShopUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<String?>> call(ReadSelectedShopParams params) {
    return _repository.readSelectedShopId();
  }
}

class ReadSelectedShopParams {
  const ReadSelectedShopParams();
}
