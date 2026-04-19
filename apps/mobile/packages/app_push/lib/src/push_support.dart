import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

Future<void> ensureFirebaseMessagingInitialized({
  FirebaseOptions? options,
}) async {
  if (Firebase.apps.isNotEmpty) {
    return;
  }

  await Firebase.initializeApp(options: options);
}

String? resolveSupportedPushPlatform() {
  if (kIsWeb) {
    return null;
  }

  switch (defaultTargetPlatform) {
    case TargetPlatform.android:
      return 'android';
    case TargetPlatform.iOS:
      return 'ios';
    default:
      return null;
  }
}
