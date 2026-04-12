import 'package:equatable/equatable.dart';

class SettingsAccountProfile extends Equatable {
  const SettingsAccountProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.locale,
    required this.emailVerifiedAt,
    required this.phoneVerifiedAt,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String locale;
  final DateTime? emailVerifiedAt;
  final DateTime? phoneVerifiedAt;
  final DateTime? createdAt;

  bool get isEmailVerified => emailVerifiedAt != null;

  bool get isPhoneVerified => phoneVerifiedAt != null;

  @override
  List<Object?> get props => <Object?>[
    id,
    name,
    email,
    phone,
    locale,
    emailVerifiedAt,
    phoneVerifiedAt,
    createdAt,
  ];
}
