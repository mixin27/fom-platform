import 'package:equatable/equatable.dart';

import '../../domain/entities/settings_snapshot.dart';

enum SettingsStatus { initial, loading, ready, error }

class SettingsState extends Equatable {
  const SettingsState({
    this.status = SettingsStatus.initial,
    this.shopId,
    this.snapshot,
    this.errorMessage,
  });

  final SettingsStatus status;
  final String? shopId;
  final SettingsSnapshot? snapshot;
  final String? errorMessage;

  bool get hasSnapshot => snapshot != null;

  SettingsState copyWith({
    SettingsStatus? status,
    String? shopId,
    SettingsSnapshot? snapshot,
    bool removeSnapshot = false,
    String? errorMessage,
    bool clearError = false,
  }) {
    return SettingsState(
      status: status ?? this.status,
      shopId: shopId ?? this.shopId,
      snapshot: removeSnapshot ? null : (snapshot ?? this.snapshot),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => <Object?>[status, shopId, snapshot, errorMessage];
}
