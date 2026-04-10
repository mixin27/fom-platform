import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../domain/entities/onboarding_slide.dart';

class OnboardingSlideContent extends StatelessWidget {
  const OnboardingSlideContent({required this.slide, super.key});

  final OnboardingSlide slide;

  @override
  Widget build(BuildContext context) {
    final titleStyle = Theme.of(context).textTheme.headlineSmall?.copyWith(
      fontWeight: FontWeight.w900,
      color: AppColors.textDark,
      height: 1.25,
      fontSize: 24,
    );

    return Column(
      children: [
        Expanded(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 320, maxHeight: 260),
              child: SvgPicture.asset(
                slide.illustrationAssetPath,
                fit: BoxFit.contain,
              ),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        Text.rich(
          TextSpan(
            style: titleStyle,
            children: [
              TextSpan(text: slide.titlePrefix),
              TextSpan(
                text: slide.titleHighlight,
                style: titleStyle?.copyWith(color: AppColors.softOrange),
              ),
              TextSpan(text: slide.titleSuffix),
            ],
          ),
          textAlign: TextAlign.center,
          textScaler: TextScaler.noScaling,
        ),
        const SizedBox(height: 10),
        Text(
          slide.description,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.textMid,
            height: 1.6,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          slide.descriptionMm,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.teal,
          ),
        ),
      ],
    );
  }
}
