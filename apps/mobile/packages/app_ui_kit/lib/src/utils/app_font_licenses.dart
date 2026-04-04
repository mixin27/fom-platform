import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Registers font licenses bundled with the UI kit.
///
/// Call this once during app bootstrap so the fonts appear
/// in the "Licenses" screen.
class AppFontLicenses {
  const AppFontLicenses._();

  static bool _registered = false;

  /// Register all bundled font licenses with [LicenseRegistry].
  static void register() {
    if (_registered) {
      return;
    }
    _registered = true;

    LicenseRegistry.addLicense(() async* {
      final license = await rootBundle.loadString(
        'packages/app_ui_kit/assets/fonts/Poppins/OFL.txt',
      );
      yield LicenseEntryWithLineBreaks(<String>['Poppins'], license);
    });

    LicenseRegistry.addLicense(() async* {
      final license = await rootBundle.loadString(
        'packages/app_ui_kit/assets/fonts/OpenSans/OFL.txt',
      );
      yield LicenseEntryWithLineBreaks(<String>['OpenSans'], license);
    });
  }
}
