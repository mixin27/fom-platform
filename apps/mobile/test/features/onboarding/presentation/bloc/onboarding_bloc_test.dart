import 'package:app_core/app_core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fom_mobile/features/onboarding/domain/entities/onboarding_slide.dart';
import 'package:fom_mobile/features/onboarding/domain/repositories/onboarding_repository.dart';
import 'package:fom_mobile/features/onboarding/domain/usecases/complete_onboarding_use_case.dart';
import 'package:fom_mobile/features/onboarding/domain/usecases/get_onboarding_completion_use_case.dart';
import 'package:fom_mobile/features/onboarding/domain/usecases/get_onboarding_slides_use_case.dart';
import 'package:fom_mobile/features/onboarding/presentation/bloc/onboarding_bloc.dart';
import 'package:fom_mobile/features/onboarding/presentation/bloc/onboarding_event.dart';
import 'package:fom_mobile/features/onboarding/presentation/bloc/onboarding_state.dart';

void main() {
  group('OnboardingBloc', () {
    test(
      'OnboardingStarted emits loading then ready when not completed',
      () async {
        final repository = _FakeOnboardingRepository(
          completionResult: Result<bool>.success(false),
        );
        final bloc = _buildBloc(repository);

        final expectation = expectLater(
          bloc.stream,
          emitsInOrder([
            isA<OnboardingState>().having(
              (state) => state.status,
              'status',
              OnboardingStatus.loading,
            ),
            isA<OnboardingState>()
                .having(
                  (state) => state.status,
                  'status',
                  OnboardingStatus.ready,
                )
                .having((state) => state.slides.length, 'slides.length', 3),
          ]),
        );

        bloc.add(const OnboardingStarted());
        await expectation;
        await bloc.close();
      },
    );

    test('OnboardingCompletionRequested emits completed on success', () async {
      final repository = _FakeOnboardingRepository();
      final bloc = _buildBloc(repository);

      final expectation = expectLater(
        bloc.stream,
        emitsInOrder([
          isA<OnboardingState>().having(
            (state) => state.isSubmitting,
            'isSubmitting',
            true,
          ),
          isA<OnboardingState>().having(
            (state) => state.status,
            'status',
            OnboardingStatus.completed,
          ),
        ]),
      );

      bloc.add(const OnboardingCompletionRequested());
      await expectation;
      await bloc.close();
    });
  });
}

OnboardingBloc _buildBloc(_FakeOnboardingRepository repository) {
  return OnboardingBloc(
    getOnboardingSlidesUseCase: GetOnboardingSlidesUseCase(repository),
    getOnboardingCompletionUseCase: GetOnboardingCompletionUseCase(repository),
    completeOnboardingUseCase: CompleteOnboardingUseCase(repository),
  );
}

class _FakeOnboardingRepository implements OnboardingRepository {
  _FakeOnboardingRepository({
    Result<List<OnboardingSlide>>? slidesResult,
    Result<bool>? completionResult,
    Result<void>? completeResult,
  }) : _slidesResult =
           slidesResult ?? Result<List<OnboardingSlide>>.success(_fakeSlides),
       _completionResult = completionResult ?? Result<bool>.success(false),
       _completeResult = completeResult ?? Result<void>.success(null);

  final Result<List<OnboardingSlide>> _slidesResult;
  final Result<bool> _completionResult;
  final Result<void> _completeResult;

  @override
  Future<Result<void>> completeOnboarding() async {
    return _completeResult;
  }

  @override
  Future<Result<List<OnboardingSlide>>> getSlides() async {
    return _slidesResult;
  }

  @override
  Future<Result<bool>> hasCompletedOnboarding() async {
    return _completionResult;
  }
}

const List<OnboardingSlide> _fakeSlides = <OnboardingSlide>[
  OnboardingSlide(
    id: 's1',
    titlePrefix: 'Track ',
    titleHighlight: 'Orders',
    titleSuffix: '',
    description: 'description 1',
    descriptionMm: 'mm 1',
    illustrationAssetPath: 'assets/one.svg',
  ),
  OnboardingSlide(
    id: 's2',
    titlePrefix: 'Update ',
    titleHighlight: 'Status',
    titleSuffix: '',
    description: 'description 2',
    descriptionMm: 'mm 2',
    illustrationAssetPath: 'assets/two.svg',
  ),
  OnboardingSlide(
    id: 's3',
    titlePrefix: 'See ',
    titleHighlight: 'Reports',
    titleSuffix: '',
    description: 'description 3',
    descriptionMm: 'mm 3',
    illustrationAssetPath: 'assets/three.svg',
  ),
];
