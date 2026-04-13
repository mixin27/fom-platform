import 'package:equatable/equatable.dart';

import 'realtime_scope.dart';

enum RealtimeConnectionStatus {
  disconnected,
  connecting,
  connected,
  reconnecting,
}

class RealtimeConnectionState extends Equatable {
  const RealtimeConnectionState({
    this.status = RealtimeConnectionStatus.disconnected,
    this.scope,
    this.shopId,
    this.errorMessage,
  });

  final RealtimeConnectionStatus status;
  final RealtimeScope? scope;
  final String? shopId;
  final String? errorMessage;

  RealtimeConnectionState copyWith({
    RealtimeConnectionStatus? status,
    RealtimeScope? scope,
    String? shopId,
    String? errorMessage,
    bool clearError = false,
  }) {
    return RealtimeConnectionState(
      status: status ?? this.status,
      scope: scope ?? this.scope,
      shopId: shopId ?? this.shopId,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => <Object?>[status, scope, shopId, errorMessage];
}
