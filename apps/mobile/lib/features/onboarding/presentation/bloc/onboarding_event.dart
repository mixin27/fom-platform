import 'package:equatable/equatable.dart';

sealed class OnboardingEvent extends Equatable {
  const OnboardingEvent();

  @override
  List<Object?> get props => const [];
}

class OnboardingStarted extends OnboardingEvent {
  const OnboardingStarted();
}

class OnboardingPageChanged extends OnboardingEvent {
  const OnboardingPageChanged(this.index);

  final int index;

  @override
  List<Object?> get props => [index];
}

class OnboardingSkipRequested extends OnboardingEvent {
  const OnboardingSkipRequested();
}

class OnboardingCompletionRequested extends OnboardingEvent {
  const OnboardingCompletionRequested();
}

class OnboardingErrorDismissed extends OnboardingEvent {
  const OnboardingErrorDismissed();
}
