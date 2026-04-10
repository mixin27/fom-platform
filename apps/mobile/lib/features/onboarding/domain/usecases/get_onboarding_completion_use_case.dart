import 'package:app_core/app_core.dart';

import '../repositories/onboarding_repository.dart';

class GetOnboardingCompletionUseCase implements UseCase<bool, NoParams> {
  const GetOnboardingCompletionUseCase(this._repository);

  final OnboardingRepository _repository;

  @override
  Future<Result<bool>> call(NoParams params) {
    return _repository.hasCompletedOnboarding();
  }
}
