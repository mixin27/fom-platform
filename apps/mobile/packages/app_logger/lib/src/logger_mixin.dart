import 'app_logger_service.dart';
import 'log_context.dart';
import 'scoped_logger.dart';

mixin LoggerMixin {
  AppLogger get logger;
  LogContext get logContext;

  ScopedLogger get log => logger.scoped(logContext);
}
