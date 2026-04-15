import 'dart:async';

class SessionExpiryNotifier {
  SessionExpiryNotifier();

  final StreamController<int> _controller = StreamController<int>.broadcast();
  int _revision = 0;

  Stream<int> get events => _controller.stream;

  void notifyExpired() {
    if (_controller.isClosed) {
      return;
    }

    _revision += 1;
    _controller.add(_revision);
  }
}
