import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// A custom progress indicator with dots for onboarding.
class AppProgressBarDots extends StatelessWidget {
  const AppProgressBarDots({
    required this.totalSteps,
    required this.currentStep,
    super.key,
  });

  /// The total number of steps.
  final int totalSteps;

  /// The current step (0-indexed).
  final int currentStep;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(totalSteps, (index) {
        final isActive = index == currentStep;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.only(right: 6),
          height: 6,
          width: isActive ? 24 : 6,
          decoration: BoxDecoration(
            color: isActive ? AppColors.softOrange : AppColors.border,
            borderRadius: BorderRadius.circular(3),
          ),
        );
      }),
    );
  }
}
