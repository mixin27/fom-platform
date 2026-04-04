import "dart:io";
import "dart:math";

import "package:app_device/src/device_metadata.dart";
import "package:app_storage/app_storage.dart";
import "package:device_info_plus/device_info_plus.dart";
import "package:package_info_plus/package_info_plus.dart";

/// Resolves and caches device + app metadata.
abstract interface class DeviceMetadataService {
  Future<DeviceMetadata> getMetadata();

  Future<void> warmUp();
}

/// Platform-backed metadata service using device and package info plugins.
class PlatformDeviceMetadataService implements DeviceMetadataService {
  PlatformDeviceMetadataService({
    required SecureStorageService secureStorageService,
    DeviceInfoPlugin? deviceInfo,
    Future<PackageInfo> Function()? packageInfoLoader,
  }) : _secureStorageService = secureStorageService,
       _deviceInfo = deviceInfo ?? DeviceInfoPlugin(),
       _packageInfoLoader = packageInfoLoader ?? PackageInfo.fromPlatform;

  static const String _fallbackDeviceIdKey = "app_device.fallback_device_id";

  final SecureStorageService _secureStorageService;
  final DeviceInfoPlugin _deviceInfo;
  final Future<PackageInfo> Function() _packageInfoLoader;

  DeviceMetadata? _cachedMetadata;

  @override
  Future<DeviceMetadata> getMetadata() async {
    final cached = _cachedMetadata;
    if (cached != null) {
      return cached;
    }

    final deviceFields = await _resolveDeviceFields();

    final packageInfo = await _safePackageInfo();
    final deviceId = await _resolveDeviceId(deviceFields.deviceId);

    final metadata = DeviceMetadata(
      deviceId: deviceId,
      deviceImei: deviceFields.deviceImei,
      deviceName: deviceFields.deviceName,
      os: deviceFields.os,
      appVersion: _resolveAppVersion(packageInfo),
    );
    _cachedMetadata = metadata;
    return metadata;
  }

  @override
  Future<void> warmUp() async {
    await getMetadata();
  }

  Future<PackageInfo?> _safePackageInfo() async {
    try {
      return await _packageInfoLoader();
    } catch (_) {
      return null;
    }
  }

  Future<_DeviceFields> _resolveDeviceFields() async {
    try {
      final info = await _deviceInfo.deviceInfo;
      final data = info.data;

      return _DeviceFields(
        os: _resolveOsName(),
        deviceName:
            _firstNonEmpty(<String?>[
              _readString(data, "name"),
              _readString(data, "model"),
              _readString(data, "device"),
              _readString(data, "product"),
            ]) ??
            "Unknown Device",
        deviceId: _firstNonEmpty(<String?>[
          _readString(data, "androidId"),
          _readString(data, "identifierForVendor"),
          _readString(data, "systemGUID"),
          _readString(data, "deviceId"),
          _readString(data, "id"),
        ]),
        deviceImei: _firstNonEmpty(<String?>[
          _readString(data, "imei"),
          _readString(data, "deviceImei"),
          _readString(data, "meid"),
          _readString(data, "serialNumber"),
        ]),
      );
    } catch (_) {
      return _DeviceFields(os: _resolveOsName(), deviceName: "Unknown Device");
    }
  }

  Future<String> _resolveDeviceId(String? candidateDeviceId) async {
    if (candidateDeviceId != null && candidateDeviceId.isNotEmpty) {
      return candidateDeviceId;
    }

    final stored = await _secureStorageService.read(key: _fallbackDeviceIdKey);
    if (stored != null && stored.isNotEmpty) {
      return stored;
    }

    final generated = _randomHex(16);
    await _secureStorageService.write(
      key: _fallbackDeviceIdKey,
      value: generated,
    );
    return generated;
  }

  String _resolveAppVersion(PackageInfo? packageInfo) {
    final version = packageInfo?.version.trim() ?? "";
    if (version.isNotEmpty) {
      return version;
    }

    final buildNumber = packageInfo?.buildNumber.trim() ?? "";
    if (buildNumber.isNotEmpty) {
      return buildNumber;
    }

    return "unknown";
  }

  String? _readString(Map<String, dynamic> map, String key) {
    final value = map[key];
    if (value is String && value.trim().isNotEmpty) {
      return value.trim();
    }
    return null;
  }

  String? _firstNonEmpty(List<String?> values) {
    for (final value in values) {
      if (value != null && value.isNotEmpty) {
        final normalized = value.trim();
        if (normalized.toLowerCase() == "unknown") {
          continue;
        }
        return normalized;
      }
    }

    return null;
  }

  String _resolveOsName() {
    if (Platform.isAndroid) {
      return "Android";
    }

    if (Platform.isIOS) {
      return "iOS";
    }

    if (Platform.isMacOS) {
      return "macOS";
    }

    if (Platform.isWindows) {
      return "Windows";
    }

    if (Platform.isLinux) {
      return "Linux";
    }

    return "Unknown";
  }

  String _randomHex(int bytesLength) {
    final random = Random.secure();
    final bytes = List<int>.generate(
      bytesLength,
      (_) => random.nextInt(256),
      growable: false,
    );
    return bytes.map((byte) => byte.toRadixString(16).padLeft(2, "0")).join();
  }
}

class _DeviceFields {
  const _DeviceFields({
    required this.os,
    required this.deviceName,
    this.deviceId,
    this.deviceImei,
  });

  final String os;
  final String deviceName;
  final String? deviceId;
  final String? deviceImei;
}
