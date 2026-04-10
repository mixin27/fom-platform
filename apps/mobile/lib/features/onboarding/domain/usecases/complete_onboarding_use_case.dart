import 'package:app_core/app_core.dart';

import '../repositories/onboarding_repository.dart';

class CompleteOnboardingUseCase implements VoidUseCase<NoParams> {
  const CompleteOnboardingUseCase(this._repository);

  final OnboardingRepository _repository;

  @override
  Future<Result<void>> call(NoParams params) {
    return _repository.completeOnboarding();
  }
}
