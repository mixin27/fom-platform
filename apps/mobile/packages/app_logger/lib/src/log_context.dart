class LogContext {
  const LogContext(this.scope, {this.feature});

  final String scope;
  final String? feature;

  String get label {
    if (feature == null || feature!.isEmpty) {
      return '[$scope]';
    }

    return '[$feature/$scope]';
  }

  String format(String message) {
    return '$label $message';
  }
}
