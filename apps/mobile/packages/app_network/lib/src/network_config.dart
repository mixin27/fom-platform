class NetworkConfig {
  const NetworkConfig({
    required this.baseUrl,
    this.connectTimeout = const Duration(seconds: 15),
    this.sendTimeout = const Duration(seconds: 15),
    this.receiveTimeout = const Duration(seconds: 15),
  });

  final String baseUrl;
  final Duration connectTimeout;
  final Duration sendTimeout;
  final Duration receiveTimeout;
}
