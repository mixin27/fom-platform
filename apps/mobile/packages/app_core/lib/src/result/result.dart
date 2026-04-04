import '../errors/failures.dart';
import '../functional/either.dart';

class Result<T> {
  const Result._(this._value);

  factory Result.success(T value) {
    return Result<T>._(Right<Failure, T>(value));
  }

  factory Result.failure(Failure failure) {
    return Result<T>._(Left<Failure, T>(failure));
  }

  final Either<Failure, T> _value;

  bool get isSuccess => _value.isRight;

  bool get isFailure => _value.isLeft;

  T? get dataOrNull => _value.rightOrNull;

  Failure? get failureOrNull => _value.leftOrNull;

  R fold<R>(
    R Function(Failure failure) onFailure,
    R Function(T data) onSuccess,
  ) {
    return _value.fold(onFailure, onSuccess);
  }
}
