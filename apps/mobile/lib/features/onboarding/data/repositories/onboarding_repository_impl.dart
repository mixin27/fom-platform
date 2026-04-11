import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';

import '../../domain/entities/onboarding_slide.dart';
import '../../domain/repositories/onboarding_repository.dart';
import '../datasources/onboarding_local_data_source.dart';

class OnboardingRepositoryImpl
    with LoggerMixin
    implements OnboardingRepository {
  OnboardingRepositoryImpl(this._localDataSource, {AppLogger? logger})
    : _logger = logger ?? AppLogger(enabled: false);

  final OnboardingLocalDataSource _localDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('OnboardingRepository');

  @override
  Future<Result<void>> completeOnboarding() async {
    try {
      await _localDataSource.setCompletedOnboarding(true);
      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error(
        'Failed to persist onboarding completion',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<void>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<List<OnboardingSlide>>> getSlides() async {
    try {
      final slides = await _localDataSource.getSlides();
      return Result<List<OnboardingSlide>>.success(slides);
    } catch (error, stackTrace) {
      log.error(
        'Failed to load onboarding slides',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<List<OnboardingSlide>>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<bool>> hasCompletedOnboarding() async {
    try {
      final hasCompleted = await _localDataSource.hasCompletedOnboarding();
      return Result<bool>.success(hasCompleted);
    } catch (error, stackTrace) {
      log.error(
        'Failed to read onboarding completion',
        error: error,
        stackTrace: stackTrace,
      );
      return Result<bool>.failure(FailureMapper.from(error));
    }
  }
}
