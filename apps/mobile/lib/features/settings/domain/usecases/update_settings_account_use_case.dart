import 'package:app_core/app_core.dart';
import 'package:equatable/equatable.dart';

import '../entities/settings_account_draft.dart';
import '../entities/settings_snapshot.dart';
import '../repositories/settings_repository.dart';

class UpdateSettingsAccountUseCase
    implements UseCase<SettingsSnapshot, UpdateSettingsAccountParams> {
  const UpdateSettingsAccountUseCase(this._repository);

  final SettingsRepository _repository;

  @override
  Future<Result<SettingsSnapshot>> call(UpdateSettingsAccountParams params) {
    return _repository.updateAccountProfile(
      shopId: params.shopId,
      draft: params.draft,
    );
  }
}

class UpdateSettingsAccountParams extends Equatable {
  const UpdateSettingsAccountParams({
    required this.shopId,
    required this.draft,
  });

  final String shopId;
  final SettingsAccountDraft draft;

  @override
  List<Object?> get props => <Object?>[shopId, draft];
}
