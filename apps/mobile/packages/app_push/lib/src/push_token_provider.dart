import 'package:app_logger/app_logger.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class PushTokenResolution {
  const PushTokenResolution({
    required this.supported,
    required this.provider,
    required this.platform,
    this.token,
  });

  final bool supported;
  final String provider;
  final String platform;
  final String? token;
}

abstract class PushTokenProvider {
  const PushTokenProvider();

  Future<PushTokenResolution> resolveToken();
}

class FirebaseMessagingPushTokenProvider extends PushTokenProvider
    with LoggerMixin {
  FirebaseMessagingPushTokenProvider({AppLogger? logger})
    : _logger = logger ?? AppLogger(enabled: false);

  final AppLogger _logger;
  Future<void>? _initialization;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext =>
      const LogContext('FirebaseMessagingPushTokenProvider');

  @override
  Future<PushTokenResolution> resolveToken() async {
    final platform = _resolvePlatform();
    if (platform == null) {
      return const PushTokenResolution(
        supported: false,
        provider: 'fcm',
        platform: 'unsupported',
        token: null,
      );
    }

    try {
      await _ensureInitialized();

      final messaging = FirebaseMessaging.instance;
      await messaging.setAutoInitEnabled(true);
      await messaging.requestPermission(alert: true, badge: true, sound: true);
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      final token = await messaging.getToken();
      final normalizedToken = token?.trim();
      return PushTokenResolution(
        supported: normalizedToken != null && normalizedToken.isNotEmpty,
        provider: 'fcm',
        platform: platform,
        token: normalizedToken,
      );
    } on Object catch (error, stackTrace) {
      log.warning('Firebase Messaging token resolution failed: $error');
      log.error(
        'Firebase Messaging token resolution stack trace',
        error: error,
        stackTrace: stackTrace,
      );
      return PushTokenResolution(
        supported: false,
        provider: 'fcm',
        platform: platform,
        token: null,
      );
    }
  }

  Future<void> _ensureInitialized() {
    return _initialization ??= _initializeFirebase();
  }

  Future<void> _initializeFirebase() async {
    if (Firebase.apps.isNotEmpty) {
      return;
    }

    await Firebase.initializeApp();
  }

  String? _resolvePlatform() {
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
}
