# app_network

Reusable network package with `dio`, API client, and auth-ready interceptor.

## Includes

- `NetworkConfig`
- `DioFactory`
- `ApiClient`
- `AuthInterceptor`
- `AuthTokenStore` + `InMemoryAuthTokenStore` + `SecureAuthTokenStore`
- `AuthTokens`
- request flags (`NetworkRequestFlags`)
- `ApiClient.postMap(..., skipAuth: true)` for login/refresh endpoints

## Usage

```dart
import 'package:app_network/app_network.dart';
import 'package:app_storage/app_storage.dart';

final tokenStore = SecureAuthTokenStore(FlutterSecureStorageService());

final dio = DioFactory.create(
  config: const NetworkConfig(baseUrl: 'https://api.example.com'),
  authTokenStore: tokenStore,
  refreshTokens: (refreshToken) async {
    // Call your auth refresh endpoint and return new tokens.
    return const AuthTokens(
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    );
  },
);

final apiClient = ApiClient(dio);
```
