import 'package:app_storage/app_storage.dart';

import 'auth_token_store.dart';
import 'auth_tokens.dart';

class SecureAuthTokenStore implements AuthTokenStore {
  SecureAuthTokenStore(this._secureStorageService);

  static const String accessTokenKey = 'auth.access_token';
  static const String refreshTokenKey = 'auth.refresh_token';

  final SecureStorageService _secureStorageService;

  @override
  Future<void> clearTokens() async {
    await _secureStorageService.delete(key: accessTokenKey);
    await _secureStorageService.delete(key: refreshTokenKey);
  }

  @override
  Future<String?> readAccessToken() {
    return _secureStorageService.read(key: accessTokenKey);
  }

  @override
  Future<String?> readRefreshToken() {
    return _secureStorageService.read(key: refreshTokenKey);
  }

  @override
  Future<void> saveTokens(AuthTokens tokens) async {
    await _secureStorageService.write(
      key: accessTokenKey,
      value: tokens.accessToken,
    );
    await _secureStorageService.write(
      key: refreshTokenKey,
      value: tokens.refreshToken,
    );
  }
}
