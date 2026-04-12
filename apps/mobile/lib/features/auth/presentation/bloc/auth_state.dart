import 'package:equatable/equatable.dart';

import '../../domain/entities/auth_access.dart';
import '../../domain/entities/auth_session.dart';
import '../../domain/entities/auth_user.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState extends Equatable {
  const AuthState({
    this.status = AuthStatus.unknown,
    this.session,
    this.activeShopId,
    this.isSubmitting = false,
    this.errorMessage,
  });

  final AuthStatus status;
  final AuthSession? session;
  final String? activeShopId;
  final bool isSubmitting;
  final String? errorMessage;

  AuthUser? get user => session?.user;

  AuthShopAccess? get activeShop {
    final currentUser = user;
    if (currentUser == null || currentUser.shopAccesses.isEmpty) {
      return null;
    }

    if (activeShopId == null || activeShopId!.trim().isEmpty) {
      return currentUser.shopAccesses.length == 1
          ? currentUser.shopAccesses.first
          : null;
    }

    for (final shop in currentUser.shopAccesses) {
      if (shop.shopId == activeShopId) {
        return shop;
      }
    }

    return currentUser.shopAccesses.length == 1
        ? currentUser.shopAccesses.first
        : null;
  }

  bool get isAuthenticated => status == AuthStatus.authenticated;

  bool get isUnauthenticated => status == AuthStatus.unauthenticated;

  bool get requiresShopSelection {
    final currentUser = user;

    return status == AuthStatus.authenticated &&
        currentUser != null &&
        currentUser.shopAccesses.length > 1 &&
        activeShop == null;
  }

  bool get hasNoShopAccess {
    final currentUser = user;

    return status == AuthStatus.authenticated &&
        currentUser != null &&
        currentUser.shopAccesses.isEmpty;
  }

  AuthState copyWith({
    AuthStatus? status,
    AuthSession? session,
    bool removeSession = false,
    String? activeShopId,
    bool removeActiveShop = false,
    bool? isSubmitting,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      session: removeSession ? null : (session ?? this.session),
      activeShopId: removeSession
          ? null
          : removeActiveShop
          ? null
          : (activeShopId ?? this.activeShopId),
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => <Object?>[
    status,
    session,
    activeShopId,
    isSubmitting,
    errorMessage,
  ];
}
