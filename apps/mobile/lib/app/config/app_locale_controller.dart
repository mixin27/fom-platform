import "dart:ui";

import "package:app_storage/app_storage.dart";
import "package:flutter/foundation.dart";

/// Controller for App Locale.
class AppLocaleController extends ChangeNotifier {
  AppLocaleController(this._sharedPreferencesService) {
    _loadSavedLocale();
  }

  static const String _localeCodeKey = "app.locale_code";

  final SharedPreferencesService _sharedPreferencesService;

  Locale? _locale;

  Locale? get locale => _locale;

  Future<void> setLocaleCode(String? localeCode) async {
    final normalizedCode = localeCode?.trim();
    if (normalizedCode == null || normalizedCode.isEmpty) {
      await _sharedPreferencesService.remove(_localeCodeKey);
      _locale = null;
      notifyListeners();
      return;
    }

    await _sharedPreferencesService.setString(_localeCodeKey, normalizedCode);
    _locale = Locale(normalizedCode);
    notifyListeners();
  }

  void _loadSavedLocale() {
    final localeCode = _sharedPreferencesService.getString(_localeCodeKey);
    if (localeCode == null || localeCode.isEmpty) {
      _locale = null;
      return;
    }

    _locale = Locale(localeCode);
  }
}
