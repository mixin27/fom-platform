import 'package:flutter_bloc/flutter_bloc.dart';

import '../../errors/failures.dart';
import '../../result/result.dart';

abstract class ResultBloc<Event, State> extends Bloc<Event, State> {
  ResultBloc(super.initialState);

  void emitResult<T>(
    Result<T> result,
    Emitter<State> emit, {
    required State Function(Failure failure) onFailure,
    required State Function(T data) onSuccess,
  }) {
    result.fold(
      (failure) => emit(onFailure(failure)),
      (data) => emit(onSuccess(data)),
    );
  }

  Future<void> executeResult<T>({
    required Emitter<State> emit,
    required State loadingState,
    required Future<Result<T>> Function() request,
    required State Function(Failure failure) onFailure,
    required State Function(T data) onSuccess,
  }) async {
    emit(loadingState);

    final result = await request();
    emitResult(result, emit, onFailure: onFailure, onSuccess: onSuccess);
  }
}
