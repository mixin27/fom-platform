import "dart:async";

import "startup_logger.dart";
import "startup_task.dart";

/// Represents Startup Runner.
class StartupRunner {
  const StartupRunner(this._logger);

  final StartupLogger _logger;

  Future<void> runCritical(List<StartupTask> tasks) async {
    for (final task in tasks.where((task) => task.isCritical)) {
      await _runTask(task);
    }
  }

  Future<void> runDeferred(List<StartupTask> tasks) async {
    final deferredTasks = tasks.where((task) => !task.isCritical).toList();
    if (deferredTasks.isEmpty) {
      return;
    }

    _logger.info("Running ${deferredTasks.length} deferred startup tasks");

    await Future.wait<void>(
      deferredTasks.map((task) async {
        try {
          await _runTask(task);
        } catch (error, stackTrace) {
          _logger.error(
            "Deferred task failed (${task.name})",
            error,
            stackTrace,
          );
        }
      }),
    );
  }

  Future<void> _runTask(StartupTask task) async {
    final stopwatch = Stopwatch()..start();
    _logger.info("Starting ${task.name}");
    await task.operation();
    stopwatch.stop();
    _logger.info(
      "Completed ${task.name} in ${stopwatch.elapsedMilliseconds}ms",
    );
  }
}
