# Mobile Push Setup

This app now uses Firebase Cloud Messaging for remote delivery and `flutter_local_notifications` for foreground presentation.

## Backend

- Set `PUSH_PROVIDER=fcm` in `apps/api`.
- Configure Firebase Admin credentials with either:
  - `FIREBASE_SERVICE_ACCOUNT_JSON`
  - or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

## Android

- Create Firebase Android apps for:
  - `com.getfom.app.dev`
  - `com.getfom.app.stg`
  - `com.getfom.app`
- Place `google-services.json` at `apps/mobile/android/app/google-services.json`.
- Build with Firebase enabled:
  - `ENABLE_FIREBASE_ANDROID=true`
  - or Gradle property `enableFirebaseAndroid=true`

## iOS

- Create a Firebase iOS app for bundle id `com.getfom.app`.
- Place `GoogleService-Info.plist` at `apps/mobile/ios/Runner/GoogleService-Info.plist`.
- Enable the `Push Notifications` capability in Xcode.
- Upload your APNs key or certificate to Firebase for that app.

## Delivery Behavior

- App open: FCM is received and shown as a local alert banner.
- App background or killed: the native FCM notification payload is shown by the OS.
- Data-only fallback: a local notification is also supported for non-visible background messages.
