import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:internet_connection_checker/internet_connection_checker.dart';

import 'network_connection_status.dart';

class NetworkConnectionService {
  NetworkConnectionService({
    Connectivity? connectivity,
    InternetConnectionChecker? internetConnectionChecker,
  }) : _connectivity = connectivity ?? Connectivity(),
       _internetConnectionChecker =
           internetConnectionChecker ?? InternetConnectionChecker.instance;

  final Connectivity _connectivity;
  final InternetConnectionChecker _internetConnectionChecker;

  final StreamController<NetworkConnectionStatus> _statusController =
      StreamController<NetworkConnectionStatus>.broadcast();

  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  StreamSubscription<InternetConnectionStatus>? _internetSubscription;

  NetworkConnectionStatus _currentStatus = NetworkConnectionStatus.unknown();
  bool _isStarted = false;

  Stream<NetworkConnectionStatus> get statusStream => _statusController.stream;

  NetworkConnectionStatus get currentStatus => _currentStatus;

  Future<void> start() async {
    if (_isStarted) {
      return;
    }

    _isStarted = true;
    await refresh();

    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
      _onConnectivityChanged,
    );

    _internetSubscription = _internetConnectionChecker.onStatusChange.listen(
      _onInternetStatusChanged,
    );
  }

  Future<NetworkConnectionStatus> refresh() async {
    final transports = await _connectivity.checkConnectivity();
    final hasInternetAccess = await _internetConnectionChecker.hasConnection;

    final status = NetworkConnectionStatus(
      transports: _normalizeTransports(transports),
      hasInternetAccess: hasInternetAccess,
      checkedAt: DateTime.now(),
    );

    _emitStatus(status);
    return status;
  }

  Future<void> stop() async {
    await _connectivitySubscription?.cancel();
    await _internetSubscription?.cancel();
    _connectivitySubscription = null;
    _internetSubscription = null;
    _isStarted = false;
  }

  Future<void> dispose() async {
    await stop();
    await _statusController.close();
  }

  Future<void> _onConnectivityChanged(
    List<ConnectivityResult> transports,
  ) async {
    final hasInternetAccess = await _internetConnectionChecker.hasConnection;

    _emitStatus(
      NetworkConnectionStatus(
        transports: _normalizeTransports(transports),
        hasInternetAccess: hasInternetAccess,
        checkedAt: DateTime.now(),
      ),
    );
  }

  Future<void> _onInternetStatusChanged(
    InternetConnectionStatus internetStatus,
  ) async {
    final transports = await _connectivity.checkConnectivity();

    _emitStatus(
      NetworkConnectionStatus(
        transports: _normalizeTransports(transports),
        hasInternetAccess: _toHasInternetAccess(internetStatus),
        checkedAt: DateTime.now(),
      ),
    );
  }

  bool _toHasInternetAccess(InternetConnectionStatus status) {
    switch (status) {
      case InternetConnectionStatus.connected:
      case InternetConnectionStatus.slow:
        return true;
      case InternetConnectionStatus.disconnected:
        return false;
    }
  }

  void _emitStatus(NetworkConnectionStatus status) {
    if (status == _currentStatus) {
      return;
    }

    _currentStatus = status;

    if (!_statusController.isClosed) {
      _statusController.add(status);
    }
  }

  List<ConnectivityResult> _normalizeTransports(
    List<ConnectivityResult> transports,
  ) {
    final deduplicated = <ConnectivityResult>{...transports};

    if (deduplicated.isEmpty ||
        deduplicated.contains(ConnectivityResult.none)) {
      return const <ConnectivityResult>[ConnectivityResult.none];
    }

    final sorted = deduplicated.toList(growable: false)
      ..sort(
        (left, right) =>
            ConnectivityResult.values.indexOf(left) -
            ConnectivityResult.values.indexOf(right),
      );

    return sorted;
  }
}
