import 'package:app_core/app_core.dart';
import 'package:equatable/equatable.dart';

import '../repositories/auth_repository.dart';

class SaveSelectedShopUseCase implements UseCase<void, SaveSelectedShopParams> {
  const SaveSelectedShopUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<void>> call(SaveSelectedShopParams params) {
    return _repository.saveSelectedShopId(params.shopId);
  }
}

class SaveSelectedShopParams extends Equatable {
  const SaveSelectedShopParams({this.shopId});

  final String? shopId;

  @override
  List<Object?> get props => <Object?>[shopId];
}
