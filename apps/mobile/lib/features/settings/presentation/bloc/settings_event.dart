import 'package:equatable/equatable.dart';

sealed class SettingsEvent extends Equatable {
  const SettingsEvent();

  @override
  List<Object?> get props => const <Object?>[];
}

final class SettingsStarted extends SettingsEvent {
  const SettingsStarted({required this.shopId, this.forceRefresh = false});

  final String shopId;
  final bool forceRefresh;

  @override
  List<Object?> get props => <Object?>[shopId, forceRefresh];
}

final class SettingsErrorDismissed extends SettingsEvent {
  const SettingsErrorDismissed();
}
