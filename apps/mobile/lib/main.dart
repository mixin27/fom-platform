import "package:flutter/foundation.dart";

import "app/bootstrap/bootstrap.dart";
import "app/config/app_environment.dart";
import "app/fom_app.dart";

/// Executes main.
Future<void> main() async {
  await bootstrap(
    () => const FomApp(),
    environmentOverride: kReleaseMode
        ? AppEnvironment.production
        : AppEnvironment.development,
  );
}
