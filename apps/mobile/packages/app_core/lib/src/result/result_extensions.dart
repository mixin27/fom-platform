import '../errors/failures.dart';
import 'result.dart';

extension ResultExtensions<T> on Result<T> {
  Result<R> map<R>(R Function(T data) transform) {
    return fold(
      Result<R>.failure,
      (data) => Result<R>.success(transform(data)),
    );
  }

  Result<R> flatMap<R>(Result<R> Function(T data) transform) {
    return fold(Result<R>.failure, transform);
  }

  Future<Result<R>> asyncMap<R>(Future<R> Function(T data) transform) async {
    return fold(
      (failure) async => Result<R>.failure(failure),
      (data) async => Result<R>.success(await transform(data)),
    );
  }

  Future<Result<R>> asyncFlatMap<R>(
    Future<Result<R>> Function(T data) transform,
  ) async {
    return fold(
      (failure) async => Result<R>.failure(failure),
      (data) async => transform(data),
    );
  }

  Result<T> mapFailure(Failure Function(Failure failure) transform) {
    return fold(
      (failure) => Result<T>.failure(transform(failure)),
      Result<T>.success,
    );
  }
}
