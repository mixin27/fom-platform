import 'auth_tokens.dart';

abstract class AuthTokenStore {
  Future<String?> readAccessToken();

  Future<String?> readRefreshToken();

  Future<void> saveTokens(AuthTokens tokens);

  Future<void> clearTokens();
}
