import 'package:app_core/app_core.dart';

import '../entities/onboarding_slide.dart';

abstract class OnboardingRepository {
  Future<Result<List<OnboardingSlide>>> getSlides();

  Future<Result<bool>> hasCompletedOnboarding();

  Future<Result<void>> completeOnboarding();
}
