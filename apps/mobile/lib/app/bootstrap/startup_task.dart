/// Type definition for Startup Operation.
typedef StartupOperation = Future<void> Function();

/// Represents Startup Task.
class StartupTask {
  const StartupTask({
    required this.name,
    required this.operation,
    this.isCritical = true,
  });

  final String name;
  final StartupOperation operation;
  final bool isCritical;
}
