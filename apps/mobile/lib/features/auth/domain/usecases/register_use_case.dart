import 'package:app_core/app_core.dart';
import 'package:equatable/equatable.dart';

import '../entities/auth_session.dart';
import '../repositories/auth_repository.dart';

class RegisterUseCase implements UseCase<AuthSession, RegisterParams> {
  const RegisterUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<AuthSession>> call(RegisterParams params) {
    return _repository.register(
      name: params.name,
      email: params.email,
      password: params.password,
      acceptedTerms: params.acceptedTerms,
      acceptedPrivacy: params.acceptedPrivacy,
      phone: params.phone,
      locale: params.locale,
    );
  }
}

class RegisterParams extends Equatable {
  const RegisterParams({
    required this.name,
    required this.email,
    required this.password,
    required this.acceptedTerms,
    required this.acceptedPrivacy,
    this.phone,
    this.locale,
  });

  final String name;
  final String email;
  final String password;
  final bool acceptedTerms;
  final bool acceptedPrivacy;
  final String? phone;
  final String? locale;

  @override
  List<Object?> get props => <Object?>[
    name,
    email,
    password,
    acceptedTerms,
    acceptedPrivacy,
    phone,
    locale,
  ];
}
