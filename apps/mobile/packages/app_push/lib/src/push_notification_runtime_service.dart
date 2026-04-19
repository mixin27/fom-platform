import 'dart:async';
import 'dart:convert';

import 'package:app_logger/app_logger.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'push_support.dart';

const AndroidNotificationChannel _pushNotificationChannel =
    AndroidNotificationChannel(
      'fom_push_high_importance',
      'FOM notifications',
      description: 'Order activity and report availability alerts.',
      importance: Importance.max,
    );

class PushNotificationTap {
  const PushNotificationTap({
    this.notificationId,
    this.actionTarget,
    this.category,
  });

  final String? notificationId;
  final String? actionTarget;
  final String? category;
}

class PushNotificationRuntimeService with LoggerMixin {
  PushNotificationRuntimeService({
    FlutterLocalNotificationsPlugin? localNotificationsPlugin,
    AppLogger? logger,
  }) : _localNotificationsPlugin =
           localNotificationsPlugin ?? FlutterLocalNotificationsPlugin(),
       _logger = logger ?? AppLogger(enabled: false);

  final FlutterLocalNotificationsPlugin _localNotificationsPlugin;
  final AppLogger _logger;
  final StreamController<PushNotificationTap> _tapController =
      StreamController<PushNotificationTap>.broadcast();

  StreamSubscription<RemoteMessage>? _foregroundMessageSubscription;
  StreamSubscription<RemoteMessage>? _openedMessageSubscription;
  Future<void>? _startOperation;
  bool _started = false;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext =>
      const LogContext('PushNotificationRuntimeService');

  Stream<PushNotificationTap> get tapEvents => _tapController.stream;

  Future<void> start() {
    return _startOperation ??= _startInternal();
  }

  Future<void> _startInternal() async {
    if (_started) {
      return;
    }

    final platform = resolveSupportedPushPlatform();
    if (platform == null) {
      log.debug('Push notification runtime skipped on unsupported platform.');
      return;
    }

    try {
      await ensureFirebaseMessagingInitialized();
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      await _configureLocalNotifications(
        _localNotificationsPlugin,
        onNotificationResponse: (response) =>
            _emitTap(_PushNotificationPayload.fromEncoded(response.payload)),
      );

      await FirebaseMessaging.instance
          .setForegroundNotificationPresentationOptions(
            alert: false,
            badge: true,
            sound: true,
          );

      _foregroundMessageSubscription ??= FirebaseMessaging.onMessage.listen((
        message,
      ) {
        unawaited(_handleForegroundMessage(message));
      });
      _openedMessageSubscription ??= FirebaseMessaging.onMessageOpenedApp
          .listen(_handleRemoteMessageTap);

      final launchDetails = await _localNotificationsPlugin
          .getNotificationAppLaunchDetails();
      if (launchDetails?.didNotificationLaunchApp ?? false) {
        _emitTap(
          _PushNotificationPayload.fromEncoded(
            launchDetails?.notificationResponse?.payload,
          ),
        );
      }

      final initialMessage = await FirebaseMessaging.instance
          .getInitialMessage();
      if (initialMessage != null) {
        _handleRemoteMessageTap(initialMessage);
      }

      _started = true;
      log.info('Push notification runtime started for $platform.');
    } on Object catch (error, stackTrace) {
      log.warning('Push notification runtime startup failed: $error');
      log.error(
        'Push notification runtime startup stack trace',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final payload = _PushNotificationPayload.fromRemoteMessage(message);
    if (!payload.hasVisibleContent) {
      return;
    }

    try {
      await _showLocalNotification(
        _localNotificationsPlugin,
        payload,
        fallbackId: message.messageId,
      );
      log.info(
        'Presented foreground push notification${payload.notificationId == null ? '' : ' ${payload.notificationId}'} via local notification.',
      );
    } on Object catch (error, stackTrace) {
      log.warning('Foreground push presentation failed: $error');
      log.error(
        'Foreground push presentation stack trace',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  void _handleRemoteMessageTap(RemoteMessage message) {
    _emitTap(_PushNotificationPayload.fromRemoteMessage(message));
  }

  void _emitTap(_PushNotificationPayload payload) {
    final actionTarget = payload.actionTarget?.trim();
    if ((actionTarget ?? '').isEmpty &&
        (payload.notificationId ?? '').trim().isEmpty) {
      return;
    }

    _tapController.add(
      PushNotificationTap(
        notificationId: payload.notificationId,
        actionTarget: actionTarget,
        category: payload.category,
      ),
    );
  }
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await ensureFirebaseMessagingInitialized();

  if (message.notification != null) {
    return;
  }

  final payload = _PushNotificationPayload.fromRemoteMessage(message);
  if (!payload.hasVisibleContent) {
    return;
  }

  final localNotificationsPlugin = FlutterLocalNotificationsPlugin();
  await _configureLocalNotifications(localNotificationsPlugin);
  await _showLocalNotification(
    localNotificationsPlugin,
    payload,
    fallbackId: message.messageId,
  );
}

Future<void> _configureLocalNotifications(
  FlutterLocalNotificationsPlugin plugin, {
  void Function(NotificationResponse response)? onNotificationResponse,
}) async {
  const initializationSettings = InitializationSettings(
    android: AndroidInitializationSettings('@drawable/ic_notification'),
    iOS: DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
      defaultPresentAlert: true,
      defaultPresentBadge: true,
      defaultPresentSound: true,
    ),
  );

  await plugin.initialize(
    settings: initializationSettings,
    onDidReceiveNotificationResponse: onNotificationResponse,
  );

  final androidPlugin = plugin
      .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin
      >();
  await androidPlugin?.createNotificationChannel(_pushNotificationChannel);
}

Future<void> _showLocalNotification(
  FlutterLocalNotificationsPlugin plugin,
  _PushNotificationPayload payload, {
  String? fallbackId,
}) async {
  await plugin.show(
    id: payload.notificationHash(fallbackId: fallbackId),
    title: payload.title,
    body: payload.body,
    notificationDetails: NotificationDetails(
      android: AndroidNotificationDetails(
        _pushNotificationChannel.id,
        _pushNotificationChannel.name,
        channelDescription: _pushNotificationChannel.description,
        importance: Importance.max,
        priority: Priority.high,
        icon: 'ic_notification',
        playSound: true,
      ),
      iOS: const DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    ),
    payload: payload.toEncodedPayload(),
  );
}

class _PushNotificationPayload {
  const _PushNotificationPayload({
    this.title,
    this.body,
    this.notificationId,
    this.actionTarget,
    this.category,
  });

  final String? title;
  final String? body;
  final String? notificationId;
  final String? actionTarget;
  final String? category;

  bool get hasVisibleContent {
    return _normalize(title).isNotEmpty || _normalize(body).isNotEmpty;
  }

  static _PushNotificationPayload fromRemoteMessage(RemoteMessage message) {
    return _PushNotificationPayload(
      title:
          _readDataString(message.data, 'title') ?? message.notification?.title,
      body: _readDataString(message.data, 'body') ?? message.notification?.body,
      notificationId: _readDataString(message.data, 'notification_id'),
      actionTarget: _readDataString(message.data, 'action_target'),
      category: _readDataString(message.data, 'category'),
    );
  }

  static _PushNotificationPayload fromEncoded(String? encodedPayload) {
    if ((encodedPayload ?? '').trim().isEmpty) {
      return const _PushNotificationPayload();
    }

    try {
      final decoded = jsonDecode(encodedPayload!);
      if (decoded is! Map) {
        return const _PushNotificationPayload();
      }

      final payload = Map<String, dynamic>.from(decoded);
      return _PushNotificationPayload(
        title: payload['title']?.toString(),
        body: payload['body']?.toString(),
        notificationId: payload['notification_id']?.toString(),
        actionTarget: payload['action_target']?.toString(),
        category: payload['category']?.toString(),
      );
    } on Object {
      return const _PushNotificationPayload();
    }
  }

  String toEncodedPayload() {
    return jsonEncode(<String, String>{
      if (_normalize(title).isNotEmpty) 'title': _normalize(title),
      if (_normalize(body).isNotEmpty) 'body': _normalize(body),
      if (_normalize(notificationId).isNotEmpty)
        'notification_id': _normalize(notificationId),
      if (_normalize(actionTarget).isNotEmpty)
        'action_target': _normalize(actionTarget),
      if (_normalize(category).isNotEmpty) 'category': _normalize(category),
    });
  }

  int notificationHash({String? fallbackId}) {
    final key = _normalize(notificationId).isNotEmpty
        ? _normalize(notificationId)
        : _normalize(fallbackId).isNotEmpty
        ? _normalize(fallbackId)
        : '${_normalize(title)}|${_normalize(body)}|${DateTime.now().millisecondsSinceEpoch}';
    return key.hashCode & 0x7fffffff;
  }

  static String? _readDataString(Map<String, dynamic> data, String key) {
    final value = data[key];
    final normalized = _normalize(value?.toString());
    return normalized.isEmpty ? null : normalized;
  }

  static String _normalize(String? value) => value?.trim() ?? '';
}
