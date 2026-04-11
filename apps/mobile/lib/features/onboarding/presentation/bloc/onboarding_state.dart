import 'package:equatable/equatable.dart';

import '../../domain/entities/onboarding_slide.dart';

enum OnboardingStatus { unknown, loading, ready, completed, failure }

class OnboardingState extends Equatable {
  const OnboardingState({
    this.status = OnboardingStatus.unknown,
    this.slides = const <OnboardingSlide>[],
    this.currentIndex = 0,
    this.isSubmitting = false,
    this.errorMessage,
  });

  final OnboardingStatus status;
  final List<OnboardingSlide> slides;
  final int currentIndex;
  final bool isSubmitting;
  final String? errorMessage;

  bool get hasSlides => slides.isNotEmpty;

  bool get isLastSlide {
    if (slides.isEmpty) {
      return true;
    }

    return currentIndex >= slides.length - 1;
  }

  OnboardingState copyWith({
    OnboardingStatus? status,
    List<OnboardingSlide>? slides,
    int? currentIndex,
    bool? isSubmitting,
    String? errorMessage,
    bool clearError = false,
  }) {
    return OnboardingState(
      status: status ?? this.status,
      slides: slides ?? this.slides,
      currentIndex: currentIndex ?? this.currentIndex,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [
    status,
    slides,
    currentIndex,
    isSubmitting,
    errorMessage,
  ];
}
