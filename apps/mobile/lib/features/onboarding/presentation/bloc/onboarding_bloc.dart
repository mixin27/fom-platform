import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/complete_onboarding_use_case.dart';
import '../../domain/usecases/get_onboarding_completion_use_case.dart';
import '../../domain/usecases/get_onboarding_slides_use_case.dart';
import 'onboarding_event.dart';
import 'onboarding_state.dart';

class OnboardingBloc extends Bloc<OnboardingEvent, OnboardingState>
    with LoggerMixin {
  OnboardingBloc({
    required GetOnboardingSlidesUseCase getOnboardingSlidesUseCase,
    required GetOnboardingCompletionUseCase getOnboardingCompletionUseCase,
    required CompleteOnboardingUseCase completeOnboardingUseCase,
    AppLogger? logger,
  }) : _getOnboardingSlidesUseCase = getOnboardingSlidesUseCase,
       _getOnboardingCompletionUseCase = getOnboardingCompletionUseCase,
       _completeOnboardingUseCase = completeOnboardingUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const OnboardingState()) {
    on<OnboardingStarted>(_onStarted);
    on<OnboardingPageChanged>(_onPageChanged);
    on<OnboardingSkipRequested>(_onSkipRequested);
    on<OnboardingCompletionRequested>(_onCompletionRequested);
    on<OnboardingErrorDismissed>(_onErrorDismissed);
  }

  final GetOnboardingSlidesUseCase _getOnboardingSlidesUseCase;
  final GetOnboardingCompletionUseCase _getOnboardingCompletionUseCase;
  final CompleteOnboardingUseCase _completeOnboardingUseCase;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('OnboardingBloc');

  Future<void> _onStarted(
    OnboardingStarted event,
    Emitter<OnboardingState> emit,
  ) async {
    if (state.status != OnboardingStatus.unknown) {
      return;
    }

    emit(
      state.copyWith(
        status: OnboardingStatus.loading,
        isSubmitting: false,
        clearError: true,
      ),
    );

    final slidesResult = await _getOnboardingSlidesUseCase(const NoParams());
    final completionResult = await _getOnboardingCompletionUseCase(
      const NoParams(),
    );

    slidesResult.fold(
      (failure) {
        emit(
          state.copyWith(
            status: OnboardingStatus.failure,
            errorMessage: failure.message,
            isSubmitting: false,
          ),
        );
      },
      (slides) {
        completionResult.fold(
          (failure) {
            emit(
              state.copyWith(
                status: slides.isEmpty
                    ? OnboardingStatus.failure
                    : OnboardingStatus.ready,
                slides: slides,
                currentIndex: 0,
                errorMessage: failure.message,
                isSubmitting: false,
              ),
            );
          },
          (hasCompleted) {
            if (hasCompleted) {
              emit(
                state.copyWith(
                  status: OnboardingStatus.completed,
                  slides: slides,
                  currentIndex: 0,
                  isSubmitting: false,
                  clearError: true,
                ),
              );
              return;
            }

            emit(
              state.copyWith(
                status: OnboardingStatus.ready,
                slides: slides,
                currentIndex: 0,
                isSubmitting: false,
                clearError: true,
              ),
            );
          },
        );
      },
    );
  }

  void _onPageChanged(
    OnboardingPageChanged event,
    Emitter<OnboardingState> emit,
  ) {
    if (state.status != OnboardingStatus.ready || state.slides.isEmpty) {
      return;
    }

    final maxIndex = state.slides.length - 1;
    final safeIndex = event.index.clamp(0, maxIndex);
    emit(state.copyWith(currentIndex: safeIndex));
  }

  Future<void> _onSkipRequested(
    OnboardingSkipRequested event,
    Emitter<OnboardingState> emit,
  ) async {
    await _markCompleted(emit);
  }

  Future<void> _onCompletionRequested(
    OnboardingCompletionRequested event,
    Emitter<OnboardingState> emit,
  ) async {
    await _markCompleted(emit);
  }

  Future<void> _markCompleted(Emitter<OnboardingState> emit) async {
    if (state.isSubmitting || state.status == OnboardingStatus.completed) {
      return;
    }

    emit(state.copyWith(isSubmitting: true, clearError: true));

    final result = await _completeOnboardingUseCase(const NoParams());
    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: state.hasSlides
                ? OnboardingStatus.ready
                : OnboardingStatus.failure,
            isSubmitting: false,
            errorMessage: failure.message,
          ),
        );
      },
      (_) {
        emit(
          state.copyWith(
            status: OnboardingStatus.completed,
            isSubmitting: false,
            clearError: true,
          ),
        );
      },
    );
  }

  void _onErrorDismissed(
    OnboardingErrorDismissed event,
    Emitter<OnboardingState> emit,
  ) {
    emit(state.copyWith(clearError: true));
  }
}
