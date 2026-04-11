import 'auth_token_store.dart';
import 'auth_tokens.dart';

class InMemoryAuthTokenStore implements AuthTokenStore {
  String? _accessToken;
  String? _refreshToken;

  @override
  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
  }

  @override
  Future<String?> readAccessToken() async {
    return _accessToken;
  }

  @override
  Future<String?> readRefreshToken() async {
    return _refreshToken;
  }

  @override
  Future<void> saveTokens(AuthTokens tokens) async {
    _accessToken = tokens.accessToken;
    _refreshToken = tokens.refreshToken;
  }
}
