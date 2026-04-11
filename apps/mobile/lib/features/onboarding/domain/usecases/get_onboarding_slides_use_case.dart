import 'package:app_core/app_core.dart';

import '../entities/onboarding_slide.dart';
import '../repositories/onboarding_repository.dart';

class GetOnboardingSlidesUseCase
    implements UseCase<List<OnboardingSlide>, NoParams> {
  const GetOnboardingSlidesUseCase(this._repository);

  final OnboardingRepository _repository;

  @override
  Future<Result<List<OnboardingSlide>>> call(NoParams params) {
    return _repository.getSlides();
  }
}
