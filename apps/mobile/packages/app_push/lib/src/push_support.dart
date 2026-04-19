import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

Future<void> ensureFirebaseMessagingInitialized() async {
  if (Firebase.apps.isNotEmpty) {
    return;
  }

  await Firebase.initializeApp();
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
