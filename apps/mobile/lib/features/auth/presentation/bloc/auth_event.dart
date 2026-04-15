import 'package:equatable/equatable.dart';

sealed class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => const <Object?>[];
}

final class AuthStarted extends AuthEvent {
  const AuthStarted();
}

final class AuthLoginSubmitted extends AuthEvent {
  const AuthLoginSubmitted({required this.email, required this.password});

  final String email;
  final String password;

  @override
  List<Object?> get props => <Object?>[email, password];
}

final class AuthRegisterSubmitted extends AuthEvent {
  const AuthRegisterSubmitted({
    required this.name,
    required this.email,
    required this.password,
    this.phone,
    this.locale,
  });

  final String name;
  final String email;
  final String password;
  final String? phone;
  final String? locale;

  @override
  List<Object?> get props => <Object?>[name, email, password, phone, locale];
}

final class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

final class AuthShopSelected extends AuthEvent {
  const AuthShopSelected({required this.shopId});

  final String shopId;

  @override
  List<Object?> get props => <Object?>[shopId];
}

final class AuthSessionRefreshRequested extends AuthEvent {
  const AuthSessionRefreshRequested();
}

final class AuthSessionExpiredDetected extends AuthEvent {
  const AuthSessionExpiredDetected();
}

final class AuthErrorDismissed extends AuthEvent {
  const AuthErrorDismissed();
}
