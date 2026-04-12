import 'package:equatable/equatable.dart';

class SettingsAccountDraft extends Equatable {
  const SettingsAccountDraft({
    required this.name,
    required this.email,
    required this.phone,
    required this.locale,
  });

  final String name;
  final String? email;
  final String? phone;
  final String locale;

  @override
  List<Object?> get props => <Object?>[name, email, phone, locale];
}
