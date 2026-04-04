# app_storage

Reusable storage package for:

- `shared_preferences` access via `SharedPreferencesService`
- `flutter_secure_storage` access via `SecureStorageService`

## Usage

```dart
final prefsService = await SharedPreferencesService.create();
final secureService = FlutterSecureStorageService();
```
