import 'package:app_logger/app_logger.dart';
import 'package:app_storage/app_storage.dart';
import 'package:get_it/get_it.dart';

import '../../../app/di/modules/dependency_module.dart';
import '../../../app/di/modules/get_it_extensions.dart';
import '../data/datasources/onboarding_local_data_source.dart';
import '../data/repositories/onboarding_repository_impl.dart';
import '../domain/repositories/onboarding_repository.dart';
import '../domain/usecases/complete_onboarding_use_case.dart';
import '../domain/usecases/get_onboarding_completion_use_case.dart';
import '../domain/usecases/get_onboarding_slides_use_case.dart';
import '../presentation/bloc/onboarding_bloc.dart';

class OnboardingModule implements DependencyModule {
  const OnboardingModule();

  @override
  void register(GetIt getIt) {
    getIt
      ..putLazySingletonIfAbsent<OnboardingLocalDataSource>(
        () => OnboardingLocalDataSourceImpl(getIt<SharedPreferencesService>()),
      )
      ..putLazySingletonIfAbsent<OnboardingRepository>(
        () => OnboardingRepositoryImpl(
          getIt<OnboardingLocalDataSource>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<GetOnboardingSlidesUseCase>(
        () => GetOnboardingSlidesUseCase(getIt<OnboardingRepository>()),
      )
      ..putLazySingletonIfAbsent<GetOnboardingCompletionUseCase>(
        () => GetOnboardingCompletionUseCase(getIt<OnboardingRepository>()),
      )
      ..putLazySingletonIfAbsent<CompleteOnboardingUseCase>(
        () => CompleteOnboardingUseCase(getIt<OnboardingRepository>()),
      )
      ..putLazySingletonIfAbsent<OnboardingBloc>(
        () => OnboardingBloc(
          getOnboardingSlidesUseCase: getIt<GetOnboardingSlidesUseCase>(),
          getOnboardingCompletionUseCase:
              getIt<GetOnboardingCompletionUseCase>(),
          completeOnboardingUseCase: getIt<CompleteOnboardingUseCase>(),
          logger: getIt<AppLogger>(),
        ),
      );
  }
}
