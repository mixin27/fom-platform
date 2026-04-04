import 'app_logger_service.dart';
import 'log_context.dart';

class ScopedLogger {
  const ScopedLogger(this._logger, this._context);

  final AppLogger _logger;
  final LogContext _context;

  void debug(String message) {
    _logger.debug(_context.format(message));
  }

  void info(String message) {
    _logger.info(_context.format(message));
  }

  void warning(String message) {
    _logger.warning(_context.format(message));
  }

  void error(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.error(
      _context.format(message),
      error: error,
      stackTrace: stackTrace,
    );
  }

  void critical(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.critical(
      _context.format(message),
      error: error,
      stackTrace: stackTrace,
    );
  }
}

extension AppLoggerScopeX on AppLogger {
  ScopedLogger scoped(LogContext context) {
    return ScopedLogger(this, context);
  }
}
