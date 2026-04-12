import 'dart:convert';

import 'package:app_network/app_network.dart';
import 'package:app_storage/app_storage.dart';

import '../models/auth_session_model.dart';
import '../models/auth_user_model.dart';

abstract class AuthLocalDataSource {
  Future<AuthTokens?> readTokens();

  Future<AuthUserModel?> readCachedUser();

  Future<String?> readSelectedShopId();

  Future<void> saveSession(AuthSessionModel session);

  Future<void> saveCachedUser(AuthUserModel user);

  Future<void> saveSelectedShopId(String? shopId);

  Future<void> clearSession();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  AuthLocalDataSourceImpl({
    required AuthTokenStore tokenStore,
    required SharedPreferencesService sharedPreferencesService,
  }) : _tokenStore = tokenStore,
       _sharedPreferencesService = sharedPreferencesService;

  static const String _cachedUserKey = 'auth.cached_user';
  static const String _selectedShopIdKey = 'auth.selected_shop_id';

  final AuthTokenStore _tokenStore;
  final SharedPreferencesService _sharedPreferencesService;

  @override
  Future<void> clearSession() async {
    await _tokenStore.clearTokens();
    await _sharedPreferencesService.remove(_cachedUserKey);
    await _sharedPreferencesService.remove(_selectedShopIdKey);
  }

  @override
  Future<AuthUserModel?> readCachedUser() async {
    final rawJson = _sharedPreferencesService.getString(_cachedUserKey);
    if (rawJson == null || rawJson.isEmpty) {
      return null;
    }

    try {
      final decoded = jsonDecode(rawJson);
      if (decoded is Map<String, dynamic>) {
        return AuthUserModel.fromJson(decoded);
      }

      if (decoded is Map) {
        return AuthUserModel.fromJson(Map<String, dynamic>.from(decoded));
      }
    } catch (_) {
      await _sharedPreferencesService.remove(_cachedUserKey);
    }

    return null;
  }

  @override
  Future<String?> readSelectedShopId() async {
    final shopId = _sharedPreferencesService.getString(_selectedShopIdKey);
    final normalized = shopId?.trim() ?? '';

    return normalized.isEmpty ? null : normalized;
  }

  @override
  Future<AuthTokens?> readTokens() async {
    final accessToken = await _tokenStore.readAccessToken();
    final refreshToken = await _tokenStore.readRefreshToken();

    final normalizedAccess = accessToken?.trim() ?? '';
    final normalizedRefresh = refreshToken?.trim() ?? '';

    if (normalizedAccess.isEmpty && normalizedRefresh.isEmpty) {
      return null;
    }

    return AuthTokens(
      accessToken: normalizedAccess,
      refreshToken: normalizedRefresh,
    );
  }

  @override
  Future<void> saveCachedUser(AuthUserModel user) async {
    final payload = jsonEncode(user.toJson());
    await _sharedPreferencesService.setString(_cachedUserKey, payload);
  }

  @override
  Future<void> saveSession(AuthSessionModel session) async {
    await _tokenStore.saveTokens(session.toTokens());
    await saveCachedUser(session.user as AuthUserModel);
  }

  @override
  Future<void> saveSelectedShopId(String? shopId) async {
    final normalized = shopId?.trim() ?? '';

    if (normalized.isEmpty) {
      await _sharedPreferencesService.remove(_selectedShopIdKey);
      return;
    }

    await _sharedPreferencesService.setString(_selectedShopIdKey, normalized);
  }
}
