import 'package:app_device/app_device.dart';
import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';

import 'push_token_provider.dart';

class PushRegistrationService with LoggerMixin {
  PushRegistrationService(
    this._apiClient,
    this._deviceMetadataService,
    this._tokenProvider, {
    AppLogger? logger,
  }) : _logger = logger ?? AppLogger(enabled: false);

  final ApiClient _apiClient;
  final DeviceMetadataService _deviceMetadataService;
  final PushTokenProvider _tokenProvider;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('PushRegistrationService');

  Future<bool> syncCurrentDevice({String? locale}) async {
    final tokenResolution = await _tokenProvider.resolveToken();
    final token = tokenResolution.token?.trim() ?? '';
    if (!tokenResolution.supported || token.isEmpty) {
      log.debug(
        'Push registration skipped because no supported token provider is configured.',
      );
      return false;
    }

    final deviceMetadata = await _deviceMetadataService.getMetadata();

    await _apiClient.postMap(
      '/push/devices',
      data: <String, dynamic>{
        'device_id': deviceMetadata.deviceId,
        'provider': tokenResolution.provider,
        'platform': tokenResolution.platform,
        'push_token': token,
        'device_name': deviceMetadata.deviceName,
        'app_version': deviceMetadata.appVersion,
        if ((locale ?? '').trim().isNotEmpty) 'locale': locale!.trim(),
      },
    );

    log.info(
      'Push device registration synced for device=${deviceMetadata.deviceId}',
    );
    return true;
  }

  Future<void> unregisterCurrentDevice() async {
    final deviceMetadata = await _deviceMetadataService.getMetadata();
    await _apiClient.deleteVoid('/push/devices/${deviceMetadata.deviceId}');
    log.info('Push device unregistered for device=${deviceMetadata.deviceId}');
  }
}
