import 'dart:typed_data';

import 'package:app_core/app_core.dart';
import 'package:dio/dio.dart';

import 'auth/network_request_flags.dart';

class ApiClient {
  ApiClient(this._dio);

  final Dio _dio;

  Future<List<Map<String, dynamic>>> getList(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.get<dynamic>(
        path,
        queryParameters: queryParameters,
        options: _options(skipAuth: skipAuth, headers: headers),
      );

      _assertSuccessStatus(response.statusCode);

      final data = _unwrapData(response.data);
      final list = _extractList(data);

      return list.map(_normalizeMap).toList(growable: false);
    } on DioException catch (error) {
      throw _mapDioException(error);
    } on FormatException catch (error) {
      throw ParseException(error.message);
    } catch (error) {
      throw UnknownException(error.toString());
    }
  }

  Future<Map<String, dynamic>> getMap(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.get<dynamic>(
        path,
        queryParameters: queryParameters,
        options: _options(skipAuth: skipAuth, headers: headers),
      );

      _assertSuccessStatus(response.statusCode);

      final data = _unwrapData(response.data);
      return _normalizeMap(data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    } on FormatException catch (error) {
      throw ParseException(error.message);
    } catch (error) {
      throw UnknownException(error.toString());
    }
  }

  Future<Uint8List> getBytes(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final options =
          (_options(skipAuth: skipAuth, headers: headers) ?? Options())
              .copyWith(responseType: ResponseType.bytes);
      final response = await _dio.get<List<int>>(
        path,
        queryParameters: queryParameters,
        options: options,
      );

      _assertSuccessStatus(response.statusCode);

      final data = response.data;
      if (data == null) {
        throw const ParseException('Response payload is empty.');
      }

      return Uint8List.fromList(data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    } on FormatException catch (error) {
      throw ParseException(error.message);
    } catch (error) {
      throw UnknownException(error.toString());
    }
  }

  Future<void> patch(
    String path, {
    Map<String, dynamic>? data,
    bool skipAuth = false,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.patch<dynamic>(
        path,
        data: data ?? <String, dynamic>{},
        options: _options(skipAuth: skipAuth, headers: headers),
      );
      _assertSuccessStatus(response.statusCode);
    } on DioException catch (error) {
      throw _mapDioException(error);
    } catch (error) {
      throw UnknownException(error.toString());
    }
  }

  Future<Map<String, dynamic>> patchMap(
    String path, {
    Map<String, dynamic>? data,
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.patch<dynamic>(
        path,
        data: data ?? <String, dynamic>{},
        queryParameters: queryParameters,
        options: _options(skipAuth: skipAuth, headers: headers),
      );
      _assertSuccessStatus(response.statusCode);
      final payload = _unwrapData(response.data);
      return _normalizeMap(payload);
    } on DioException catch (error) {
      throw _mapDioException(error);
    } on FormatException catch (error) {
      throw ParseException(error.message);
    } catch (error) {
      throw UnknownException(error.toString());
    }
  }

  Future<Map<String, dynamic>> postMap(
    String path, {
    Map<String, dynamic>? data,
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.post<dynamic>(
        path,
        data: data ?? <String, dynamic>{},
        queryParameters: queryParameters,
        options: _options(skipAuth: skipAuth, headers: headers),
      );

      _assertSuccessStatus(response.statusCode);
      final payload = _unwrapData(response.data);
      return _normalizeMap(payload);
    } on DioException catch (error) {
      throw _mapDioException(error);
    } on FormatException catch (error) {
      throw ParseException(error.message);
    } catch (error) {
      throw UnknownException(error.toString());
    }
  }

  Future<void> postVoid(
    String path, {
    Map<String, dynamic>? data,
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.post<dynamic>(
        path,
        data: data ?? <String, dynamic>{},
        queryParameters: queryParameters,
        options: _options(skipAuth: skipAuth, headers: headers),
      );

      _assertSuccessStatus(response.statusCode);
    } on DioException catch (error) {
      throw _mapDioException(error);
    } catch (error) {
      throw UnknownException(error.toString());
    }
  }

  Future<Map<String, dynamic>> deleteMap(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.delete<dynamic>(
        path,
        data: const <String, dynamic>{},
        queryParameters: queryParameters,
        options: _options(skipAuth: skipAuth, headers: headers),
      );
      _assertSuccessStatus(response.statusCode);
      final payload = _unwrapData(response.data);
      return _normalizeMap(payload);
    } on DioException catch (error) {
      throw _mapDioException(error);
    } on FormatException catch (error) {
      throw ParseException(error.message);
    } catch (error) {
      throw UnknownException(error.toString());
    }
  }

  Future<void> deleteVoid(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.delete<dynamic>(
        path,
        data: const <String, dynamic>{},
        queryParameters: queryParameters,
        options: _options(skipAuth: skipAuth, headers: headers),
      );
      _assertSuccessStatus(response.statusCode);
    } on DioException catch (error) {
      throw _mapDioException(error);
    } catch (error) {
      throw UnknownException(error.toString());
    }
  }

  void _assertSuccessStatus(int? statusCode) {
    if (statusCode == null) {
      throw const ServerException(message: 'Missing response status code.');
    }

    if (statusCode < 200 || statusCode >= 300) {
      throw ServerException(
        message: 'Unexpected response status: $statusCode',
        statusCode: statusCode,
      );
    }
  }

  List<dynamic> _extractList(dynamic data) {
    if (data is List<dynamic>) {
      return data;
    }

    if (data is Map<String, dynamic>) {
      final payload = data['data'];
      if (payload is List<dynamic>) {
        return payload;
      }

      final items = data['items'];
      if (items is List<dynamic>) {
        return items;
      }
    }

    throw const FormatException('Response payload is not a list.');
  }

  dynamic _unwrapData(dynamic payload) {
    if (payload is Map<String, dynamic> && payload.containsKey('data')) {
      return payload['data'];
    }
    return payload;
  }

  Map<String, dynamic> _normalizeMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    throw const FormatException('List item is not an object.');
  }

  AppException _mapDioException(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
      case DioExceptionType.badCertificate:
      case DioExceptionType.unknown:
        return const NetworkException('Please check your internet connection.');
      case DioExceptionType.cancel:
        return const NetworkException('Request was cancelled.');
      case DioExceptionType.badResponse:
        return ServerException(
          message: _extractMessage(error.response?.data),
          statusCode: error.response?.statusCode,
          code: _extractCode(error.response?.data),
          payload: _extractPayload(error.response?.data),
        );
    }
  }

  String _extractMessage(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      final error = payload['error'];
      if (error is Map<String, dynamic>) {
        final baseMessage = _safeString(error['message']);
        final details = _extractErrorDetails(
          error['details'] ?? payload['details'],
        );
        if (baseMessage != null && details != null) {
          return '$baseMessage: $details';
        }
        if (baseMessage != null) {
          return baseMessage;
        }
      }
      final message = _safeString(payload['message']);
      if (message != null) {
        return message;
      }
    }

    return 'Server request failed.';
  }

  String? _extractCode(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      final error = payload['error'];
      if (error is Map<String, dynamic>) {
        final code = _safeString(error['code']);
        if (code != null) {
          return code;
        }
      }

      final code = _safeString(payload['code']);
      if (code != null) {
        return code;
      }
    }

    return null;
  }

  Map<String, dynamic>? _extractPayload(dynamic payload) {
    if (payload is Map<String, dynamic>) {
      return payload;
    }

    if (payload is Map) {
      return Map<String, dynamic>.from(payload);
    }

    return null;
  }

  String? _safeString(dynamic value) {
    if (value is String && value.trim().isNotEmpty) {
      return value.trim();
    }
    return null;
  }

  String? _extractErrorDetails(dynamic details) {
    if (details is! List) {
      return null;
    }

    final parts = <String>[];
    for (final entry in details) {
      if (entry is Map) {
        final field = _safeString(entry['field']) ?? 'field';
        final errors = entry['errors'];
        if (errors is List && errors.isNotEmpty) {
          final errorText = errors.map((e) => e.toString()).join(', ');
          parts.add('$field - $errorText');
          continue;
        }
        parts.add(field);
        continue;
      }
      parts.add(entry.toString());
    }

    if (parts.isEmpty) {
      return null;
    }

    return parts.join('; ');
  }

  Options? _options({required bool skipAuth, Map<String, dynamic>? headers}) {
    final extra = <String, dynamic>{};
    if (skipAuth) {
      extra[NetworkRequestFlags.skipAuth] = true;
    }

    if (extra.isEmpty && headers == null) {
      return null;
    }

    return Options(extra: extra.isEmpty ? null : extra, headers: headers);
  }
}
