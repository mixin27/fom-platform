import 'dart:async';
import 'dart:convert';

import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import 'realtime_connection_state.dart';
import 'realtime_event.dart';
import 'realtime_scope.dart';

class AppRealtimeService with LoggerMixin {
  AppRealtimeService(this._apiClient, this._networkConfig, {AppLogger? logger})
    : _logger = logger ?? AppLogger(enabled: false);

  final ApiClient _apiClient;
  final NetworkConfig _networkConfig;
  final AppLogger _logger;

  final StreamController<RealtimeConnectionState> _connectionController =
      StreamController<RealtimeConnectionState>.broadcast();
  final StreamController<RealtimeEvent> _eventController =
      StreamController<RealtimeEvent>.broadcast();

  RealtimeConnectionState _state = const RealtimeConnectionState();
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _channelSubscription;
  Timer? _reconnectTimer;
  bool _disposed = false;
  int _reconnectAttempt = 0;
  RealtimeScope? _desiredScope;
  String? _desiredShopId;
  String? _desiredAccessToken;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('AppRealtimeService');

  Stream<RealtimeConnectionState> get connectionStateStream =>
      _connectionController.stream;
  Stream<RealtimeEvent> get events => _eventController.stream;
  RealtimeConnectionState get currentState => _state;

  Future<void> connect({
    required RealtimeScope scope,
    String? shopId,
    String? accessToken,
  }) async {
    _desiredScope = scope;
    _desiredShopId = scope == RealtimeScope.shop ? shopId?.trim() : null;
    _desiredAccessToken = accessToken?.trim();

    if (_desiredScope == RealtimeScope.shop &&
        (_desiredShopId ?? '').trim().isEmpty) {
      await disconnect();
      return;
    }

    await _openSocket(isReconnect: false);
  }

  Future<void> disconnect() async {
    _desiredScope = null;
    _desiredShopId = null;
    _desiredAccessToken = null;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    await _channelSubscription?.cancel();
    _channelSubscription = null;
    await _channel?.sink.close();
    _channel = null;
    _reconnectAttempt = 0;
    _emitConnectionState(
      const RealtimeConnectionState(
        status: RealtimeConnectionStatus.disconnected,
      ),
    );
  }

  Future<void> dispose() async {
    _disposed = true;
    await disconnect();
    await _connectionController.close();
    await _eventController.close();
  }

  Future<void> _openSocket({required bool isReconnect}) async {
    if (_disposed || _desiredScope == null) {
      return;
    }

    final scope = _desiredScope!;
    final shopId = _desiredShopId;
    final accessToken = _desiredAccessToken?.trim();

    _reconnectTimer?.cancel();
    _emitConnectionState(
      _state.copyWith(
        status: isReconnect
            ? RealtimeConnectionStatus.reconnecting
            : RealtimeConnectionStatus.connecting,
        scope: scope,
        shopId: shopId,
        clearError: true,
      ),
    );

    try {
      final ticketPayload = await _apiClient.getMap(
        '/realtime/tickets',
        queryParameters: <String, dynamic>{
          'scope': scope == RealtimeScope.platform ? 'platform' : 'shop',
          if (scope == RealtimeScope.shop && shopId != null) 'shop_id': shopId,
        },
        headers: accessToken != null && accessToken.isNotEmpty
            ? <String, dynamic>{'Authorization': 'Bearer $accessToken'}
            : null,
      );
      final ticket = (ticketPayload['ticket'] ?? '').toString().trim();
      final websocketPath = (ticketPayload['websocket_path'] ?? '')
          .toString()
          .trim();

      if (ticket.isEmpty || websocketPath.isEmpty) {
        throw const ParseException('Realtime ticket response is incomplete.');
      }

      final uri = _buildWebsocketUri(websocketPath, ticket);
      final channel = WebSocketChannel.connect(uri);

      await _channelSubscription?.cancel();
      await _channel?.sink.close();

      _channel = channel;
      _channelSubscription = channel.stream.listen(
        _handleSocketMessage,
        onDone: _handleSocketClosed,
        onError: (Object error, StackTrace stackTrace) {
          log.error(
            'Realtime websocket failed',
            error: error,
            stackTrace: stackTrace,
          );
          _handleSocketClosed();
        },
      );
    } catch (error, stackTrace) {
      log.error(
        'Realtime connect failed',
        error: error,
        stackTrace: stackTrace,
      );
      _emitConnectionState(
        _state.copyWith(
          status: RealtimeConnectionStatus.disconnected,
          scope: scope,
          shopId: shopId,
          errorMessage: error.toString(),
        ),
      );
      _scheduleReconnect();
    }
  }

  Uri _buildWebsocketUri(String websocketPath, String ticket) {
    final baseUri = Uri.parse(_networkConfig.baseUrl);
    final normalizedScheme = baseUri.scheme == 'https' ? 'wss' : 'ws';
    final pathSegments = websocketPath
        .split('/')
        .where((segment) {
          return segment.trim().isNotEmpty;
        })
        .toList(growable: false);

    return baseUri.replace(
      scheme: normalizedScheme,
      pathSegments: pathSegments,
      queryParameters: <String, String>{'ticket': ticket},
    );
  }

  void _handleSocketMessage(dynamic rawMessage) {
    try {
      final decoded = jsonDecode(rawMessage as String);
      if (decoded is! Map) {
        return;
      }

      final event = RealtimeEvent.fromJson(Map<String, dynamic>.from(decoded));
      if (event.kind == RealtimeEventKind.connectionReady) {
        _reconnectAttempt = 0;
        _emitConnectionState(
          _state.copyWith(
            status: RealtimeConnectionStatus.connected,
            scope: event.scope ?? _state.scope,
            shopId: event.shopId ?? _state.shopId,
            clearError: true,
          ),
        );
      }

      _eventController.add(event);
    } catch (error, stackTrace) {
      log.error(
        'Failed to parse realtime event',
        error: error,
        stackTrace: stackTrace,
      );
    }
  }

  void _handleSocketClosed() {
    if (_disposed) {
      return;
    }

    _channel = null;
    _channelSubscription = null;
    _emitConnectionState(
      _state.copyWith(status: RealtimeConnectionStatus.disconnected),
    );
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    if (_disposed || _desiredScope == null || _reconnectTimer != null) {
      return;
    }

    _reconnectAttempt += 1;
    final delaySeconds = _reconnectAttempt.clamp(1, 5);
    _reconnectTimer = Timer(Duration(seconds: delaySeconds), () {
      _reconnectTimer = null;
      unawaited(_openSocket(isReconnect: true));
    });
  }

  void _emitConnectionState(RealtimeConnectionState nextState) {
    _state = nextState;
    if (!_connectionController.isClosed) {
      _connectionController.add(nextState);
    }
  }
}
