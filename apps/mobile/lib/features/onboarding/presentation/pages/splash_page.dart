import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fom_mobile/features/auth/feature_auth.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/di/injection_container.dart';
import '../../../../app/router/app_router.dart';
import '../bloc/onboarding_bloc.dart';
import '../bloc/onboarding_event.dart';
import '../bloc/onboarding_state.dart';

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<OnboardingBloc>.value(value: getIt<OnboardingBloc>()),
        BlocProvider<AuthBloc>.value(value: getIt<AuthBloc>()),
      ],
      child: const _SplashView(),
    );
  }
}

class _SplashView extends StatefulWidget {
  const _SplashView();

  @override
  State<_SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends State<_SplashView> {
  @override
  void initState() {
    super.initState();

    final onboardingBloc = context.read<OnboardingBloc>();
    if (onboardingBloc.state.status == OnboardingStatus.unknown) {
      onboardingBloc.add(const OnboardingStarted());
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, authState) {
        return BlocBuilder<OnboardingBloc, OnboardingState>(
          builder: (context, onboardingState) {
            final showInitializationState =
                authState.status != AuthStatus.unauthenticated ||
                onboardingState.status == OnboardingStatus.unknown ||
                onboardingState.status == OnboardingStatus.loading;

            if (showInitializationState) {
              return _InitializationScaffold(
                title: authState.isAuthenticated
                    ? 'Preparing your workspace'
                    : 'Starting FOM Order Manager',
                subtitle: authState.isAuthenticated
                    ? 'Loading your shop access, notifications, and latest data.'
                    : 'Checking session and preparing app state.',
              );
            }

        return Scaffold(
          backgroundColor: AppColors.warmWhite,
          body: Stack(
            children: [
              Positioned.fill(
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFFFFF8F4),
                        AppColors.warmWhite,
                        Color(0xFFF0F9F8),
                      ],
                      stops: [0.0, 0.5, 1.0],
                    ),
                  ),
                ),
              ),
              Positioned(
                top: -60,
                right: -60,
                child: Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFCDB8).withValues(alpha: 0.4),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Positioned(
                bottom: 80,
                left: -60,
                child: Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    color: const Color(0xFFC8EDEA).withValues(alpha: 0.4),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xxl,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Spacer(),
                      Center(
                        child: Container(
                          width: 88,
                          height: 88,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [AppColors.softOrange, Color(0xFFFF8C5A)],
                            ),
                            borderRadius: BorderRadius.circular(26),
                            boxShadow: const [
                              BoxShadow(
                                color: AppColors.orangeShadow,
                                blurRadius: 32,
                                offset: Offset(0, 12),
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.inventory_2_rounded,
                              size: 46,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Text.rich(
                        TextSpan(
                          children: const [
                            TextSpan(text: 'Order '),
                            TextSpan(
                              text: 'Manager',
                              style: TextStyle(color: AppColors.softOrange),
                            ),
                          ],
                          style: Theme.of(context).textTheme.headlineLarge
                              ?.copyWith(
                                fontWeight: FontWeight.w900,
                                color: AppColors.textDark,
                                fontSize: 26,
                              ),
                        ),
                        textAlign: TextAlign.center,
                        textScaler: TextScaler.noScaling,
                        textDirection: TextDirection.ltr,
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        'For Facebook Sellers',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMid,
                        ),
                      ),
                      Text(
                        'ဖေ့ဘုတ်ရောင်းသူများအတွက်',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.teal,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _FeatureChip(
                            icon: Icons.inventory_2_outlined,
                            label: 'Orders',
                          ),
                          SizedBox(width: AppSpacing.sm),
                          _FeatureChip(
                            icon: Icons.local_shipping_outlined,
                            label: 'Delivery',
                          ),
                          SizedBox(width: AppSpacing.sm),
                          _FeatureChip(
                            icon: Icons.bar_chart_rounded,
                            label: 'Reports',
                          ),
                        ],
                      ),
                      const Spacer(),
                      AppButton(
                        text: 'စတင်မည် — Get Started',
                        onPressed: onboardingState.status ==
                                OnboardingStatus.loading
                            ? null
                            : () => _onGetStartedPressed(
                                context,
                                onboardingState,
                              ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      AppButton(
                        text: 'Login to Existing Account',
                        variant: AppButtonVariant.secondary,
                        onPressed: () {
                          context.go(AppRouter.authPath);
                        },
                      ),
                      const SizedBox(height: AppSpacing.md),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
          },
        );
      },
    );
  }

  void _onGetStartedPressed(BuildContext context, OnboardingState state) {
    if (state.status == OnboardingStatus.completed) {
      context.go(AppRouter.authPath);
      return;
    }

    context.go(AppRouter.onboardingPath);
  }
}

class _FeatureChip extends StatelessWidget {
  const _FeatureChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.border, width: 1.5),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.textMid),
          const SizedBox(width: 5),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: AppColors.textMid,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

class _InitializationScaffold extends StatelessWidget {
  const _InitializationScaffold({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.warmWhite,
      body: Stack(
        children: [
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFFFFF8F4),
                    AppColors.warmWhite,
                    Color(0xFFF0F9F8),
                  ],
                  stops: [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.xxl,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 88,
                      height: 88,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppColors.softOrange,
                            Color(0xFFFF8C5A),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(26),
                        boxShadow: const [
                          BoxShadow(
                            color: AppColors.orangeShadow,
                            blurRadius: 32,
                            offset: Offset(0, 12),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.inventory_2_rounded,
                          size: 46,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    Text(
                      title,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: AppColors.textDark,
                          ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      subtitle,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textMid,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    const SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppColors.softOrange,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
