import 'package:app_push/app_push.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:fom_mobile/firebase_options_dev.dart' as development;
import 'package:fom_mobile/firebase_options_prod.dart' as production;
import 'package:fom_mobile/firebase_options_stg.dart' as staging;

import '../app_environment.dart';

FirebaseOptions firebaseOptionsForEnvironment(AppEnvironment environment) {
  switch (environment) {
    case AppEnvironment.development:
      return development.DefaultFirebaseOptions.currentPlatform;
    case AppEnvironment.staging:
      return staging.DefaultFirebaseOptions.currentPlatform;
    case AppEnvironment.production:
      return production.DefaultFirebaseOptions.currentPlatform;
  }
}

Future<void> ensureFirebaseInitializedForEnvironment(
  AppEnvironment environment,
) async {
  if (Firebase.apps.isNotEmpty) {
    return;
  }

  await Firebase.initializeApp(
    options: firebaseOptionsForEnvironment(environment),
  );
}

BackgroundMessageHandler firebaseBackgroundMessageHandlerForEnvironment(
  AppEnvironment environment,
) {
  switch (environment) {
    case AppEnvironment.development:
      return developmentFirebaseMessagingBackgroundHandler;
    case AppEnvironment.staging:
      return stagingFirebaseMessagingBackgroundHandler;
    case AppEnvironment.production:
      return productionFirebaseMessagingBackgroundHandler;
  }
}

@pragma('vm:entry-point')
Future<void> developmentFirebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  await ensureFirebaseInitializedForEnvironment(AppEnvironment.development);
  await handleBackgroundPushRemoteMessage(message);
}

@pragma('vm:entry-point')
Future<void> stagingFirebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  await ensureFirebaseInitializedForEnvironment(AppEnvironment.staging);
  await handleBackgroundPushRemoteMessage(message);
}

@pragma('vm:entry-point')
Future<void> productionFirebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  await ensureFirebaseInitializedForEnvironment(AppEnvironment.production);
  await handleBackgroundPushRemoteMessage(message);
}
