import 'package:equatable/equatable.dart';

class OnboardingSlide extends Equatable {
  const OnboardingSlide({
    required this.id,
    required this.titlePrefix,
    required this.titleHighlight,
    required this.titleSuffix,
    required this.description,
    required this.descriptionMm,
    required this.illustrationAssetPath,
  });

  final String id;
  final String titlePrefix;
  final String titleHighlight;
  final String titleSuffix;
  final String description;
  final String descriptionMm;
  final String illustrationAssetPath;

  @override
  List<Object?> get props => [
    id,
    titlePrefix,
    titleHighlight,
    titleSuffix,
    description,
    descriptionMm,
    illustrationAssetPath,
  ];
}
