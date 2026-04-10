import '../../domain/entities/onboarding_slide.dart';

class OnboardingSlideModel extends OnboardingSlide {
  const OnboardingSlideModel({
    required super.id,
    required super.titlePrefix,
    required super.titleHighlight,
    required super.titleSuffix,
    required super.description,
    required super.descriptionMm,
    required super.illustrationAssetPath,
  });

  factory OnboardingSlideModel.fromJson(Map<String, dynamic> json) {
    return OnboardingSlideModel(
      id: _asString(json['id']),
      titlePrefix: _asString(json['title_prefix']),
      titleHighlight: _asString(json['title_highlight']),
      titleSuffix: _asString(json['title_suffix']),
      description: _asString(json['description']),
      descriptionMm: _asString(json['description_mm']),
      illustrationAssetPath: _asString(json['illustration_asset_path']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'title_prefix': titlePrefix,
      'title_highlight': titleHighlight,
      'title_suffix': titleSuffix,
      'description': description,
      'description_mm': descriptionMm,
      'illustration_asset_path': illustrationAssetPath,
    };
  }
}

String _asString(dynamic value) {
  if (value == null) {
    return '';
  }

  return value.toString();
}
