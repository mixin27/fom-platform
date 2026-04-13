import "package:app_localizations/app_localizations.dart";
import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";

import "app_runtime_bindings.dart";
import "config/app_config.dart";
import "config/app_environment.dart";
import "config/app_locale_controller.dart";
import "di/injection_container.dart";
import "router/app_router.dart";

/// Represents App.
class FomApp extends StatelessWidget {
  const FomApp({super.key});

  @override
  Widget build(BuildContext context) {
    final appRouter = getIt<AppRouter>();
    final appConfig = getIt<AppConfig>();
    final localeController = getIt<AppLocaleController>();

    return AnimatedBuilder(
      animation: localeController,
      builder: (context, child) {
        return AppRuntimeBindings(
          child: MaterialApp.router(
            onGenerateTitle: (context) =>
                _buildAppTitle(context, appConfig.environment),
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light,
            routerConfig: appRouter.config,
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            locale: localeController.locale,
          ),
        );
      },
    );
  }

  String _buildAppTitle(BuildContext context, AppEnvironment environment) {
    final l10n = context.l10n;
    switch (environment) {
      case AppEnvironment.development:
        return l10n.appTitleDev;
      case AppEnvironment.staging:
        return l10n.appTitleStaging;
      case AppEnvironment.production:
        return l10n.appTitle;
    }
  }
}
