import "package:app_storage/app_storage.dart";
import "package:flutter/widgets.dart";
import "package:flutter_test/flutter_test.dart";
import "package:fom_mobile/app/config/app_locale_controller.dart";
import "package:shared_preferences/shared_preferences.dart";

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group("AppLocaleController", () {
    test("loads saved locale from shared preferences", () async {
      SharedPreferences.setMockInitialValues(<String, Object>{
        "app.locale_code": "my",
      });
      final sharedPreferencesService = await SharedPreferencesService.create();

      final controller = AppLocaleController(sharedPreferencesService);

      expect(controller.locale, const Locale("my"));
    });

    test("setLocaleCode saves locale and notifies listeners", () async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final sharedPreferencesService = await SharedPreferencesService.create();
      final controller = AppLocaleController(sharedPreferencesService);

      var notified = false;
      controller.addListener(() {
        notified = true;
      });

      await controller.setLocaleCode("en");

      expect(controller.locale, const Locale("en"));
      expect(sharedPreferencesService.getString("app.locale_code"), "en");
      expect(notified, isTrue);
    });

    test("setLocaleCode null clears locale and stored preference", () async {
      SharedPreferences.setMockInitialValues(<String, Object>{
        "app.locale_code": "en",
      });
      final sharedPreferencesService = await SharedPreferencesService.create();
      final controller = AppLocaleController(sharedPreferencesService);

      await controller.setLocaleCode(null);

      expect(controller.locale, isNull);
      expect(sharedPreferencesService.getString("app.locale_code"), isNull);
    });
  });
}
