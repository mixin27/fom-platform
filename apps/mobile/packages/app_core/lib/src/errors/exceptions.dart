class AppException implements Exception {
  const AppException(this.message);

  final String message;

  @override
  String toString() {
    return '$runtimeType: $message';
  }
}

class NetworkException extends AppException {
  const NetworkException(super.message);
}

class ServerException extends AppException {
  const ServerException({
    required String message,
    this.statusCode,
    this.code,
    this.payload,
  }) : super(message);

  final int? statusCode;
  final String? code;
  final Map<String, dynamic>? payload;
}

class CacheException extends AppException {
  const CacheException(super.message);
}

class ParseException extends AppException {
  const ParseException(super.message);
}

class UnknownException extends AppException {
  const UnknownException(super.message);
}
