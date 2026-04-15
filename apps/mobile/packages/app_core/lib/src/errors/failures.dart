import 'package:equatable/equatable.dart';

sealed class Failure extends Equatable {
  const Failure(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
}

class NetworkFailure extends Failure {
  const NetworkFailure(super.message);
}

class ServerFailure extends Failure {
  const ServerFailure({
    required String message,
    this.statusCode,
    this.code,
    this.payload,
  }) : super(message);

  final int? statusCode;
  final String? code;
  final Map<String, dynamic>? payload;

  @override
  List<Object?> get props => [message, statusCode, code, payload];
}

class CacheFailure extends Failure {
  const CacheFailure(super.message);
}

class ParsingFailure extends Failure {
  const ParsingFailure(super.message);
}

class UnexpectedFailure extends Failure {
  const UnexpectedFailure(super.message);
}
