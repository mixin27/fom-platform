import 'package:app_network/app_network.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('NetworkConnectionStatus', () {
    test('reports online when transport exists and internet is reachable', () {
      final status = NetworkConnectionStatus(
        transports: const <ConnectivityResult>[ConnectivityResult.wifi],
        hasInternetAccess: true,
        checkedAt: DateTime.now(),
      );

      expect(status.isOnline, isTrue);
      expect(status.isOffline, isFalse);
      expect(status.primaryTransportLabel, equals('Wi-Fi'));
    });

    test('reports offline when there is no internet access', () {
      final status = NetworkConnectionStatus(
        transports: const <ConnectivityResult>[ConnectivityResult.mobile],
        hasInternetAccess: false,
        checkedAt: DateTime.now(),
      );

      expect(status.isOnline, isFalse);
      expect(status.isOffline, isTrue);
    });
  });
}
