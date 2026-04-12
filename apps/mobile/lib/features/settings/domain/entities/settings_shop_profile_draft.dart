import 'package:equatable/equatable.dart';

class SettingsShopProfileDraft extends Equatable {
  const SettingsShopProfileDraft({required this.name, required this.timezone});

  final String name;
  final String timezone;

  @override
  List<Object?> get props => <Object?>[name, timezone];
}
