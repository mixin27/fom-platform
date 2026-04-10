import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/di/injection_container.dart';
import '../../../../app/router/app_router.dart';
import '../bloc/onboarding_bloc.dart';
import '../bloc/onboarding_event.dart';
import '../bloc/onboarding_state.dart';
import '../widgets/onboarding_slide_content.dart';

class OnboardingPage extends StatelessWidget {
  const OnboardingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<OnboardingBloc>.value(
      value: getIt<OnboardingBloc>(),
      child: const _OnboardingView(),
    );
  }
}

class _OnboardingView extends StatefulWidget {
  const _OnboardingView();

  @override
  State<_OnboardingView> createState() => _OnboardingViewState();
}

class _OnboardingViewState extends State<_OnboardingView> {
  late final PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();

    final onboardingBloc = context.read<OnboardingBloc>();
    if (onboardingBloc.state.status == OnboardingStatus.unknown) {
      onboardingBloc.add(const OnboardingStarted());
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<OnboardingBloc, OnboardingState>(
      listenWhen: (previous, current) {
        return previous.status != current.status ||
            previous.errorMessage != current.errorMessage;
      },
      listener: (context, state) {
        final errorMessage = state.errorMessage;
        if (errorMessage != null && errorMessage.isNotEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(errorMessage),
              behavior: SnackBarBehavior.floating,
            ),
          );
          context.read<OnboardingBloc>().add(const OnboardingErrorDismissed());
        }

        if (state.status == OnboardingStatus.completed) {
          context.go(AppRouter.authPath);
        }
      },
      builder: (context, state) {
        final totalSlides = state.slides.isEmpty ? 3 : state.slides.length;
        final currentStep = state.currentIndex.clamp(0, totalSlides - 1);

        return Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.lg,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: AppSpacing.md),
                  AppProgressBarDots(
                    totalSteps: totalSlides,
                    currentStep: currentStep,
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Expanded(child: _buildBody(state)),
                  const SizedBox(height: AppSpacing.xl),
                  AppButton(
                    text: state.isLastSlide ? 'Let\'s Go →' : 'Next →',
                    isLoading: state.isSubmitting,
                    onPressed: state.status == OnboardingStatus.ready
                        ? () => _onPrimaryAction(context, state)
                        : null,
                  ),
                  const SizedBox(height: 14),
                  GestureDetector(
                    onTap: state.status == OnboardingStatus.ready
                        ? () {
                            context.read<OnboardingBloc>().add(
                              const OnboardingSkipRequested(),
                            );
                          }
                        : null,
                    child: Text(
                      'Skip intro',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: state.status == OnboardingStatus.ready
                            ? AppColors.textLight
                            : AppColors.textLight.withValues(alpha: 0.4),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBody(OnboardingState state) {
    if (state.status == OnboardingStatus.loading ||
        state.status == OnboardingStatus.unknown) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.slides.isEmpty) {
      return Center(
        child: Text(
          'Unable to load onboarding slides right now.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textMid,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }

    return PageView.builder(
      controller: _pageController,
      itemCount: state.slides.length,
      onPageChanged: (index) {
        context.read<OnboardingBloc>().add(OnboardingPageChanged(index));
      },
      itemBuilder: (context, index) {
        final slide = state.slides[index];
        return OnboardingSlideContent(slide: slide);
      },
    );
  }

  Future<void> _onPrimaryAction(
    BuildContext context,
    OnboardingState state,
  ) async {
    if (state.isLastSlide) {
      context.read<OnboardingBloc>().add(const OnboardingCompletionRequested());
      return;
    }

    final nextIndex = state.currentIndex + 1;
    await _pageController.animateToPage(
      nextIndex,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeOutCubic,
    );
  }
}
