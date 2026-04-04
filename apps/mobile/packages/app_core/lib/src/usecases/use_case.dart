import '../functional/either.dart';
import '../result/result.dart';

/// Base contract for async use cases that return a [Result].
abstract class UseCase<T, Params> {
  Future<Result<T>> call(Params params);
}

/// Base contract for synchronous use cases that return a [Result].
abstract class SyncUseCase<T, Params> {
  Result<T> call(Params params);
}

/// Base contract for stream-based use cases.
abstract class StreamUseCase<T, Params> {
  Stream<T> call(Params params);
}

/// Semantic alias for use cases that return [Result<void>].
abstract class VoidUseCase<Params> implements UseCase<void, Params> {}

/// Base contract for use cases that return an [Either] result.
abstract class EitherUseCase<L, R, Params> {
  Future<Either<L, R>> call(Params params);
}

/// Marker params for use cases with no input.
class NoParams {
  const NoParams();
}
