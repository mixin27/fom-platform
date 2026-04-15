import 'package:app_device/app_device.dart';
import 'package:app_network/app_network.dart';

import '../models/auth_session_model.dart';
import '../models/auth_user_model.dart';

abstract class AuthRemoteDataSource {
  Future<AuthSessionModel> login({
    required String email,
    required String password,
    bool logoutOtherDevice = false,
  });

  Future<AuthSessionModel> register({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? locale,
  });

  Future<AuthSessionModel> refresh({required String refreshToken});

  Future<AuthUserModel> getCurrentUser();

  Future<void> logout();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  AuthRemoteDataSourceImpl(this._apiClient, this._deviceMetadataService);

  final ApiClient _apiClient;
  final DeviceMetadataService _deviceMetadataService;

  @override
  Future<AuthUserModel> getCurrentUser() async {
    final payload = await _apiClient.getMap('/users/me');
    return AuthUserModel.fromJson(payload);
  }

  @override
  Future<AuthSessionModel> login({
    required String email,
    required String password,
    bool logoutOtherDevice = false,
  }) async {
    final clientHeaders = await _buildClientHeaders();
    final payload = await _apiClient.postMap(
      '/auth/login',
      data: <String, dynamic>{
        'email': email.trim(),
        'password': password,
        if (logoutOtherDevice) 'logout_other_device': true,
      },
      headers: clientHeaders,
      skipAuth: true,
    );

    return AuthSessionModel.fromJson(payload);
  }

  @override
  Future<void> logout() {
    return _apiClient.postVoid('/auth/logout');
  }

  @override
  Future<AuthSessionModel> refresh({required String refreshToken}) async {
    final clientHeaders = await _buildClientHeaders();
    final payload = await _apiClient.postMap(
      '/auth/refresh',
      data: <String, dynamic>{'refresh_token': refreshToken},
      headers: clientHeaders,
      skipAuth: true,
    );

    return AuthSessionModel.fromJson(payload);
  }

  @override
  Future<AuthSessionModel> register({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? locale,
  }) async {
    final clientHeaders = await _buildClientHeaders();
    final payload = await _apiClient.postMap(
      '/auth/register',
      data: <String, dynamic>{
        'name': name.trim(),
        'email': email.trim(),
        'password': password,
        if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
        if (locale != null && locale.trim().isNotEmpty) 'locale': locale.trim(),
      },
      headers: clientHeaders,
      skipAuth: true,
    );

    return AuthSessionModel.fromJson(payload);
  }

  Future<Map<String, dynamic>> _buildClientHeaders() async {
    final deviceMetadata = await _deviceMetadataService.getMetadata();

    return <String, dynamic>{
      'X-Client-Platform': 'mobile',
      'X-Device-Id': deviceMetadata.deviceId,
      'X-Device-Name': deviceMetadata.deviceName,
    };
  }
}
