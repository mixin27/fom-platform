import 'package:dio/dio.dart';

import 'exceptions.dart';
import 'failures.dart';

class FailureMapper {
  const FailureMapper._();

  static Failure from(Object error) {
    if (error is Failure) {
      return error;
    }

    if (error is NetworkException) {
      return NetworkFailure(error.message);
    }

    if (error is ServerException) {
      return ServerFailure(
        message: error.message,
        statusCode: error.statusCode,
      );
    }

    if (error is CacheException) {
      return CacheFailure(error.message);
    }

    if (error is ParseException || error is FormatException) {
      return ParsingFailure(error.toString());
    }

    if (error is DioException) {
      return _fromDio(error);
    }

    return UnexpectedFailure(error.toString());
  }

  static Failure _fromDio(DioException exception) {
    switch (exception.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
      case DioExceptionType.unknown:
        return const NetworkFailure('Please check your internet connection.');
      case DioExceptionType.badResponse:
        return ServerFailure(
          message: _extractMessage(exception.response?.data),
          statusCode: exception.response?.statusCode,
        );
      case DioExceptionType.cancel:
        return const NetworkFailure('Request was cancelled.');
      case DioExceptionType.badCertificate:
        return const NetworkFailure('Unable to verify secure connection.');
    }
  }

  static String _extractMessage(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      final message = payload['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
    }

    return 'Server request failed.';
  }
}
