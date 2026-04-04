import 'package:talker/talker.dart';

class AppLogger {
  AppLogger({
    Talker? talker,
    String? prefix,
    bool enabled = true,
    String? logLevel,
  }) : _prefix = prefix,
       _minLogLevel = _resolveLogLevel(logLevel),
       _enabled = _resolveEnabled(enabled: enabled, logLevel: logLevel),
       _talker =
           talker ??
           Talker(
             settings: TalkerSettings(
               enabled: _resolveEnabled(enabled: enabled, logLevel: logLevel),
             ),
             logger: TalkerLogger(
               settings: TalkerLoggerSettings(
                 level: _resolveLogLevel(logLevel),
                 enable: _resolveEnabled(enabled: enabled, logLevel: logLevel),
               ),
             ),
           );

  final Talker _talker;
  final String? _prefix;
  final LogLevel _minLogLevel;
  final bool _enabled;

  Talker get talker => _talker;

  void debug(String message) {
    if (!_shouldLog(LogLevel.debug)) {
      return;
    }

    _talker.debug(_withPrefix(message));
  }

  void info(String message) {
    if (!_shouldLog(LogLevel.info)) {
      return;
    }

    _talker.info(_withPrefix(message));
  }

  void warning(String message) {
    if (!_shouldLog(LogLevel.warning)) {
      return;
    }

    _talker.warning(_withPrefix(message));
  }

  void error(String message, {Object? error, StackTrace? stackTrace}) {
    if (!_shouldLog(LogLevel.error)) {
      return;
    }

    _talker.error(_withPrefix(message), error, stackTrace);
  }

  void critical(String message, {Object? error, StackTrace? stackTrace}) {
    if (!_shouldLog(LogLevel.critical)) {
      return;
    }

    _talker.critical(_withPrefix(message), error, stackTrace);
  }

  bool _shouldLog(LogLevel level) {
    if (!_enabled) {
      return false;
    }

    final levelIndex = _priority.indexOf(level);
    final minIndex = _priority.indexOf(_minLogLevel);
    if (levelIndex == -1 || minIndex == -1) {
      return true;
    }

    return levelIndex <= minIndex;
  }

  String _withPrefix(String message) {
    if (_prefix == null || _prefix.isEmpty) {
      return message;
    }

    return '$_prefix $message';
  }

  static bool _resolveEnabled({
    required bool enabled,
    required String? logLevel,
  }) {
    if (!enabled) {
      return false;
    }

    final normalized = logLevel?.trim().toLowerCase();
    if (normalized == null || normalized.isEmpty) {
      return true;
    }

    switch (normalized) {
      case 'off':
      case 'none':
      case 'disable':
      case 'disabled':
        return false;
      default:
        return true;
    }
  }

  static LogLevel _resolveLogLevel(String? logLevel) {
    final normalized = logLevel?.trim().toLowerCase();
    switch (normalized) {
      case 'critical':
      case 'fatal':
        return LogLevel.critical;
      case 'error':
      case 'err':
        return LogLevel.error;
      case 'warning':
      case 'warn':
        return LogLevel.warning;
      case 'info':
        return LogLevel.info;
      case 'debug':
        return LogLevel.debug;
      case 'verbose':
      case 'trace':
        return LogLevel.verbose;
      case 'off':
      case 'none':
      case 'disable':
      case 'disabled':
        return LogLevel.critical;
      default:
        return LogLevel.verbose;
    }
  }

  static const List<LogLevel> _priority = [
    LogLevel.critical,
    LogLevel.error,
    LogLevel.warning,
    LogLevel.info,
    LogLevel.debug,
    LogLevel.verbose,
  ];
}
