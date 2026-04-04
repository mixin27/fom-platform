import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.warmWhite,
      body: Stack(
        children: [
          // Background Gradient
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFFFFF8F4), // Light warm
                    AppColors.warmWhite,
                    Color(0xFFF0F9F8), // Light teal
                  ],
                  stops: [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),
          // Blobs (Approximations)
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
          // Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(),
                  // Logo Wrap
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
                        child: Icon(Icons.inventory_2_rounded, size: 46, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  // App Name
                  Text.rich(
                    TextSpan(
                      children: const [
                        TextSpan(text: 'Order '),
                        TextSpan(text: 'Manager', style: TextStyle(color: AppColors.softOrange)),
                      ],
                      style: TextTheme.of(context).headlineLarge?.copyWith(
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
                  // App Tagline
                  Text(
                    'For Facebook Sellers',
                    textAlign: TextAlign.center,
                    style: TextTheme.of(context).bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMid,
                        ),
                  ),
                  Text(
                    'ဖေ့ဘုတ်ရောင်းသူများအတွက်',
                    textAlign: TextAlign.center,
                    style: TextTheme.of(context).bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.teal,
                        ),
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  // Feature Chips
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _FeatureChip(icon: '📦', label: 'Orders'),
                      SizedBox(width: AppSpacing.sm),
                      _FeatureChip(icon: '🚚', label: 'Delivery'),
                      SizedBox(width: AppSpacing.sm),
                      _FeatureChip(icon: '📊', label: 'Reports'),
                    ],
                  ),
                  const Spacer(),
                  // Buttons
                  ElevatedButton(
                    onPressed: () {
                      context.push('/onboarding');
                    },
                    child: const Text('စတင်မည် — Get Started'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  OutlinedButton(
                    onPressed: () {
                      context.push('/auth');
                    },
                    child: const Text('Login to Existing Account'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureChip extends StatelessWidget {
  const _FeatureChip({required this.icon, required this.label});

  final String icon;
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
          Text(icon, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextTheme.of(context).labelSmall?.copyWith(
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
