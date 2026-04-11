import 'package:connectivity_plus/connectivity_plus.dart';

class NetworkConnectionStatus {
  const NetworkConnectionStatus({
    required this.transports,
    required this.hasInternetAccess,
    required this.checkedAt,
  });

  factory NetworkConnectionStatus.unknown() {
    return NetworkConnectionStatus(
      transports: const <ConnectivityResult>[],
      hasInternetAccess: false,
      checkedAt: DateTime.fromMillisecondsSinceEpoch(0),
    );
  }

  final List<ConnectivityResult> transports;
  final bool hasInternetAccess;
  final DateTime checkedAt;

  bool get hasNetworkTransport {
    if (transports.isEmpty) {
      return false;
    }

    return transports.any((result) => result != ConnectivityResult.none);
  }

  bool get isOnline => hasNetworkTransport && hasInternetAccess;

  bool get isOffline => !isOnline;

  String get primaryTransportLabel {
    if (transports.contains(ConnectivityResult.wifi)) {
      return 'Wi-Fi';
    }

    if (transports.contains(ConnectivityResult.mobile)) {
      return 'mobile data';
    }

    if (transports.contains(ConnectivityResult.ethernet)) {
      return 'ethernet';
    }

    if (transports.contains(ConnectivityResult.vpn)) {
      return 'VPN';
    }

    if (transports.contains(ConnectivityResult.bluetooth)) {
      return 'bluetooth';
    }

    if (transports.contains(ConnectivityResult.other)) {
      return 'network';
    }

    return 'offline';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }

    return other is NetworkConnectionStatus &&
        hasInternetAccess == other.hasInternetAccess &&
        _listEquals(transports, other.transports);
  }

  @override
  int get hashCode {
    return Object.hash(hasInternetAccess, Object.hashAll(transports));
  }

  static bool _listEquals<T>(List<T> left, List<T> right) {
    if (left.length != right.length) {
      return false;
    }

    for (var i = 0; i < left.length; i++) {
      if (left[i] != right[i]) {
        return false;
      }
    }

    return true;
  }
}
