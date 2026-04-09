import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:fom_mobile/app/router/app_router.dart';
import 'package:go_router/go_router.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: AppSpacing.xxl),
              // Progress dots
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(3, (index) {
                  final isActive = index == _currentIndex;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    height: 6,
                    width: isActive ? 24 : 6,
                    decoration: BoxDecoration(
                      color: isActive ? AppColors.softOrange : AppColors.border,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
              const SizedBox(height: AppSpacing.xxl),

              // Illustration Mockup
              Expanded(
                child: Center(
                  child: Container(
                    width: 240,
                    height: 200,
                    alignment: Alignment.center,
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        // Main Card
                        Positioned(
                          left: 20,
                          top: 20,
                          child: Container(
                            width: 200,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.1),
                                  blurRadius: 24,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  children: [
                                    const CircleAvatar(
                                      radius: 14,
                                      backgroundColor: AppColors.softOrangeMid,
                                      child: Text(
                                        '👤',
                                        style: TextStyle(fontSize: 12),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            height: 6,
                                            width: 90,
                                            color: AppColors.textDark,
                                            margin: const EdgeInsets.only(
                                              bottom: 4,
                                            ),
                                          ),
                                          Container(
                                            height: 6,
                                            width: 60,
                                            color: AppColors.border,
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.softOrange,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: const Text(
                                        'New',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 9,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    const CircleAvatar(
                                      radius: 14,
                                      backgroundColor: AppColors.softOrangeMid,
                                      child: Text(
                                        '📦',
                                        style: TextStyle(fontSize: 12),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Container(
                                            height: 6,
                                            width: 100,
                                            color: AppColors.textDark,
                                            margin: const EdgeInsets.only(
                                              bottom: 4,
                                            ),
                                          ),
                                          Container(
                                            height: 6,
                                            width: 45,
                                            color: AppColors.border,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        // Mini Card
                        Positioned(
                          right: -10,
                          top: 120,
                          child: Container(
                            width: 130,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.14),
                                  blurRadius: 32,
                                  offset: const Offset(0, 12),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  'TODAY',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.softOrange,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  height: 6,
                                  width: double.infinity,
                                  color: AppColors.textDark,
                                  margin: const EdgeInsets.only(bottom: 6),
                                ),
                                Container(
                                  height: 6,
                                  width: 80,
                                  color: AppColors.border,
                                  margin: const EdgeInsets.only(bottom: 4),
                                ),
                                Container(
                                  height: 6,
                                  width: 60,
                                  color: AppColors.border,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: AppSpacing.xxl),

              // Texts
              Text.rich(
                TextSpan(
                  children: const [
                    TextSpan(text: 'Track Every '),
                    TextSpan(
                      text: 'Order',
                      style: TextStyle(color: AppColors.softOrange),
                    ),
                    TextSpan(text: ' Instantly'),
                  ],
                  style: TextTheme.of(context).headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                    fontSize: 24,
                    height: 1.25,
                  ),
                ),
                textAlign: TextAlign.center,
                textScaler: TextScaler.noScaling,
              ),
              const SizedBox(height: 10),
              Text(
                'No more messy notes or forgotten orders. Add orders in seconds, right from Messenger.',
                textAlign: TextAlign.center,
                style: TextTheme.of(context).bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMid,
                  height: 1.6,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'မက်ဆင်ဂျာမှ အော်ဒါများကို လျင်မြန်စွာ ထည့်သွင်းပါ',
                textAlign: TextAlign.center,
                style: TextTheme.of(context).bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.teal,
                ),
              ),

              const SizedBox(height: AppSpacing.xxl),

              // Actions
              ElevatedButton(
                onPressed: () {
                  if (_currentIndex < 2) {
                    setState(() {
                      _currentIndex++;
                    });
                  } else {
                    context.push(AppRouter.authPath);
                  }
                },
                child: Text(_currentIndex < 2 ? 'Next →' : 'Let\'s Go →'),
              ),
              const SizedBox(height: 14),
              GestureDetector(
                onTap: () {
                  context.push(AppRouter.authPath);
                },
                child: Text(
                  'Skip intro',
                  textAlign: TextAlign.center,
                  style: TextTheme.of(context).labelLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textLight,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
