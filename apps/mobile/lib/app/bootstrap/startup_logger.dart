import "package:app_logger/app_logger.dart";

/// Represents Startup Logger.
class StartupLogger {
  const StartupLogger({required bool enabled, required AppLogger logger})
    : _enabled = enabled,
      _logger = logger;

  final bool _enabled;
  final AppLogger _logger;

  void info(String message) {
    if (!_enabled) {
      return;
    }

    _logger.info("[Startup] $message");
  }

  void error(String message, Object error, StackTrace stackTrace) {
    _logger.error(
      "[Startup][Error] $message",
      error: error,
      stackTrace: stackTrace,
    );
  }
}
