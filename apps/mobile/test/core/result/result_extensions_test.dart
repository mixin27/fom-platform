import 'package:app_core/app_core.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ResultExtensions', () {
    test('map transforms success value', () {
      final input = Result<int>.success(4);

      final result = input.map((value) => value * 2);

      expect(result.isSuccess, isTrue);
      expect(result.dataOrNull, equals(8));
    });

    test('flatMap chains success to success', () {
      final input = Result<int>.success(2);

      final result = input.flatMap(
        (value) => Result<String>.success('value:$value'),
      );

      expect(result.isSuccess, isTrue);
      expect(result.dataOrNull, equals('value:2'));
    });

    test('mapFailure transforms failure while preserving failure state', () {
      final input = Result<int>.failure(const NetworkFailure('offline'));

      final result = input.mapFailure(
        (failure) => CacheFailure('mapped: ${failure.message}'),
      );

      expect(result.isFailure, isTrue);
      expect(
        result.failureOrNull,
        equals(const CacheFailure('mapped: offline')),
      );
    });

    test('asyncMap transforms success asynchronously', () async {
      final input = Result<int>.success(3);

      final result = await input.asyncMap((value) async => value + 7);

      expect(result.isSuccess, isTrue);
      expect(result.dataOrNull, equals(10));
    });

    test('asyncFlatMap chains async success to result', () async {
      final input = Result<int>.success(5);

      final result = await input.asyncFlatMap(
        (value) async => Result<String>.success('ok:$value'),
      );

      expect(result.isSuccess, isTrue);
      expect(result.dataOrNull, equals('ok:5'));
    });
  });
}
