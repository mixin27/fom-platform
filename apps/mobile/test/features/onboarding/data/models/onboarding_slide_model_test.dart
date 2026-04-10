import 'package:flutter_test/flutter_test.dart';
import 'package:fom_mobile/features/onboarding/data/models/onboarding_slide_model.dart';
import 'package:fom_mobile/features/onboarding/domain/entities/onboarding_slide.dart';

void main() {
  group('OnboardingSlideModel', () {
    test('extends OnboardingSlide and parses from json', () {
      final model = OnboardingSlideModel.fromJson(const <String, dynamic>{
        'id': 'track_orders',
        'title_prefix': 'Track Every ',
        'title_highlight': 'Order',
        'title_suffix': ' Instantly',
        'description': 'Description',
        'description_mm': 'ဖော်ပြချက်',
        'illustration_asset_path':
            'assets/illustrations/onboarding/onboarding_orders.svg',
      });

      expect(model, isA<OnboardingSlide>());
      expect(model.id, equals('track_orders'));
      expect(model.titleHighlight, equals('Order'));
      expect(
        model.illustrationAssetPath,
        equals('assets/illustrations/onboarding/onboarding_orders.svg'),
      );
    });
  });
}
