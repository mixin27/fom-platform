/// Resolved device and app metadata used by auth API payloads.
class DeviceMetadata {
  const DeviceMetadata({
    required this.deviceId,
    required this.deviceName,
    required this.os,
    required this.appVersion,
    this.deviceImei,
  });

  final String deviceId;
  final String? deviceImei;
  final String deviceName;
  final String os;
  final String appVersion;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      "deviceId": deviceId,
      "deviceImei": deviceImei,
      "deviceName": deviceName,
      "os": os,
      "appVersion": appVersion,
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }

    return other is DeviceMetadata &&
        other.deviceId == deviceId &&
        other.deviceImei == deviceImei &&
        other.deviceName == deviceName &&
        other.os == os &&
        other.appVersion == appVersion;
  }

  @override
  int get hashCode =>
      Object.hash(deviceId, deviceImei, deviceName, os, appVersion);
}
