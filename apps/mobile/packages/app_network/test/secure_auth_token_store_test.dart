import 'package:app_network/app_network.dart';
import 'package:app_storage/app_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('saves and reads auth tokens from secure storage', () async {
    final secureStorageService = _FakeSecureStorageService();
    final store = SecureAuthTokenStore(secureStorageService);

    await store.saveTokens(
      const AuthTokens(
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      ),
    );

    expect(await store.readAccessToken(), equals('access-token'));
    expect(await store.readRefreshToken(), equals('refresh-token'));
  });

  test('clearTokens only clears auth keys', () async {
    final secureStorageService = _FakeSecureStorageService();
    final store = SecureAuthTokenStore(secureStorageService);

    await secureStorageService.write(key: 'session.pin', value: '1234');
    await store.saveTokens(
      const AuthTokens(
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      ),
    );

    await store.clearTokens();

    expect(await secureStorageService.read(key: 'session.pin'), equals('1234'));
    expect(await store.readAccessToken(), isNull);
    expect(await store.readRefreshToken(), isNull);
  });
}

class _FakeSecureStorageService implements SecureStorageService {
  final Map<String, String> _storage = <String, String>{};

  @override
  Future<void> delete({required String key}) async {
    _storage.remove(key);
  }

  @override
  Future<void> deleteAll() async {
    _storage.clear();
  }

  @override
  Future<String?> read({required String key}) async {
    return _storage[key];
  }

  @override
  Future<void> write({required String key, required String value}) async {
    _storage[key] = value;
  }
}
