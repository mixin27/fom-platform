import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';

/// A horizontal progress stepper with design system styling.
class AppStepper extends StatelessWidget {
  const AppStepper({
    required this.totalSteps,
    required this.currentStep,
    required this.stepLabels,
    super.key,
  });

  /// The total number of steps.
  final int totalSteps;

  /// The current step (0-indexed).
  final int currentStep;

  /// The labels for each step.
  final List<String> stepLabels;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: List.generate(totalSteps, (index) {
            final isDone = index < currentStep;
            final isActive = index == currentStep;

            return Expanded(
              child: Row(
                children: [
                  // Step Node
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: isDone ? AppColors.softOrange : Colors.white,
                      border: Border.all(
                        color: (isDone || isActive)
                            ? AppColors.softOrange
                            : AppColors.border,
                        width: 2,
                      ),
                      shape: BoxShape.circle,
                      boxShadow: isActive
                          ? [
                              const BoxShadow(
                                color: AppColors.softOrangeLight,
                                blurRadius: 0,
                                spreadRadius: 4,
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: isDone
                          ? const Icon(
                              Icons.check,
                              size: 16,
                              color: Colors.white,
                            )
                          : Text(
                              '${index + 1}',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                                color: isActive
                                    ? AppColors.softOrange
                                    : AppColors.textLight,
                              ),
                            ),
                    ),
                  ),

                  // Connector Line
                  if (index < totalSteps - 1)
                    Expanded(
                      child: Container(
                        height: 2,
                        color: index < currentStep
                            ? AppColors.softOrange
                            : AppColors.border,
                      ),
                    ),
                ],
              ),
            );
          }),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(totalSteps, (index) {
            final isDone = index < currentStep;
            final isActive = index == currentStep;

            return Expanded(
              child: Text(
                stepLabels[index],
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.04,
                  color: isActive
                      ? AppColors.softOrange
                      : isDone
                      ? AppColors.textMid
                      : AppColors.textLight,
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}
