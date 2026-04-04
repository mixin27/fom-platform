library;

import 'package:flutter/material.dart';

import 'l10n/gen/app_localizations.dart';

export 'src/formatters.dart';
export 'l10n/gen/app_localizations.dart';

/// Extension to access the [AppLocalizations] instance in a [BuildContext].
extension AppLocalizationsX on BuildContext {
  /// Returns the [AppLocalizations] instance for the current [BuildContext].
  AppLocalizations get l10n => AppLocalizations.of(this);
}
