import 'package:app_storage/app_storage.dart';

import '../models/onboarding_slide_model.dart';

abstract class OnboardingLocalDataSource {
  Future<bool> hasCompletedOnboarding();

  Future<void> setCompletedOnboarding(bool isCompleted);

  Future<List<OnboardingSlideModel>> getSlides();
}

class OnboardingLocalDataSourceImpl implements OnboardingLocalDataSource {
  OnboardingLocalDataSourceImpl(this._sharedPreferencesService);

  static const String _completedKey = 'onboarding.completed';

  final SharedPreferencesService _sharedPreferencesService;

  @override
  Future<List<OnboardingSlideModel>> getSlides() async {
    return _rawSlides
        .map((json) => OnboardingSlideModel.fromJson(json))
        .toList(growable: false);
  }

  @override
  Future<bool> hasCompletedOnboarding() async {
    return _sharedPreferencesService.getBool(_completedKey) ?? false;
  }

  @override
  Future<void> setCompletedOnboarding(bool isCompleted) async {
    await _sharedPreferencesService.setBool(_completedKey, isCompleted);
  }
}

const List<Map<String, dynamic>> _rawSlides = <Map<String, dynamic>>[
  <String, dynamic>{
    'id': 'track_orders',
    'title_prefix': 'Track Every ',
    'title_highlight': 'Order',
    'title_suffix': ' Instantly',
    'description':
        'No more messy notes or forgotten orders. Add orders in seconds, right from Messenger.',
    'description_mm': 'မက်ဆင်ဂျာမှ အော်ဒါများကို လျင်မြန်စွာ ထည့်သွင်းပါ',
    'illustration_asset_path':
        'assets/illustrations/onboarding/onboarding_orders.svg',
  },
  <String, dynamic>{
    'id': 'update_status',
    'title_prefix': 'Update ',
    'title_highlight': 'Delivery',
    'title_suffix': ' Status Fast',
    'description':
        'Confirm, dispatch, and deliver with one tap. Keep your team and buyers updated in real time.',
    'description_mm':
        'အတည်ပြုခြင်းမှ ပို့ဆောင်ပြီးအထိ တစ်ချက်နှိပ်ဖြင့် အခြေအနေပြောင်းပါ',
    'illustration_asset_path':
        'assets/illustrations/onboarding/onboarding_delivery.svg',
  },
  <String, dynamic>{
    'id': 'daily_reports',
    'title_prefix': 'See ',
    'title_highlight': 'Daily',
    'title_suffix': ' Performance',
    'description':
        'Monitor orders, revenue, and pending tasks in one clean dashboard before your day ends.',
    'description_mm':
        'နေ့စဉ် အော်ဒါ၊ ဝင်ငွေ၊ ကျန်ရှိလုပ်ငန်းများကို တစ်နေရာတည်းတွင်ကြည့်ပါ',
    'illustration_asset_path':
        'assets/illustrations/onboarding/onboarding_reports.svg',
  },
];
