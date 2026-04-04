import 'package:app_network/app_network.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('saves and clears auth tokens in memory', () async {
    final store = InMemoryAuthTokenStore();

    await store.saveTokens(
      const AuthTokens(
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      ),
    );

    expect(await store.readAccessToken(), equals('access-token'));
    expect(await store.readRefreshToken(), equals('refresh-token'));

    await store.clearTokens();

    expect(await store.readAccessToken(), isNull);
    expect(await store.readRefreshToken(), isNull);
  });
}
