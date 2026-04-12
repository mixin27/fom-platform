import 'package:app_core/app_core.dart';
import 'package:equatable/equatable.dart';

import '../entities/settings_shop_profile_draft.dart';
import '../entities/settings_snapshot.dart';
import '../repositories/settings_repository.dart';

class UpdateSettingsShopProfileUseCase
    implements UseCase<SettingsSnapshot, UpdateSettingsShopProfileParams> {
  const UpdateSettingsShopProfileUseCase(this._repository);

  final SettingsRepository _repository;

  @override
  Future<Result<SettingsSnapshot>> call(
    UpdateSettingsShopProfileParams params,
  ) {
    return _repository.updateShopProfile(
      shopId: params.shopId,
      draft: params.draft,
    );
  }
}

class UpdateSettingsShopProfileParams extends Equatable {
  const UpdateSettingsShopProfileParams({
    required this.shopId,
    required this.draft,
  });

  final String shopId;
  final SettingsShopProfileDraft draft;

  @override
  List<Object?> get props => <Object?>[shopId, draft];
}
