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

class NoopPushTokenProvider extends PushTokenProvider {
  const NoopPushTokenProvider();

  @override
  Future<PushTokenResolution> resolveToken() async {
    return const PushTokenResolution(
      supported: false,
      provider: 'noop',
      platform: 'unknown',
      token: null,
    );
  }
}
