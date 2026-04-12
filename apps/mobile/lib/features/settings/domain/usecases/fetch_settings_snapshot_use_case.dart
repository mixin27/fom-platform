import 'package:app_core/app_core.dart';
import 'package:equatable/equatable.dart';

import '../entities/settings_snapshot.dart';
import '../repositories/settings_repository.dart';

class FetchSettingsSnapshotUseCase
    implements UseCase<SettingsSnapshot, FetchSettingsSnapshotParams> {
  const FetchSettingsSnapshotUseCase(this._repository);

  final SettingsRepository _repository;

  @override
  Future<Result<SettingsSnapshot>> call(FetchSettingsSnapshotParams params) {
    return _repository.fetchSettingsSnapshot(shopId: params.shopId);
  }
}

class FetchSettingsSnapshotParams extends Equatable {
  const FetchSettingsSnapshotParams({required this.shopId});

  final String shopId;

  @override
  List<Object?> get props => <Object?>[shopId];
}
