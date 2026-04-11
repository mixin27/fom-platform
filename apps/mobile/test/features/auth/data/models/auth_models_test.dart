import 'package:flutter_test/flutter_test.dart';
import 'package:fom_mobile/features/auth/data/models/auth_session_model.dart';
import 'package:fom_mobile/features/auth/data/models/auth_user_model.dart';
import 'package:fom_mobile/features/auth/domain/entities/auth_session.dart';
import 'package:fom_mobile/features/auth/domain/entities/auth_user.dart';

void main() {
  group('Auth models', () {
    test('AuthUserModel extends AuthUser and parses access payloads', () {
      final user = AuthUserModel.fromJson(const <String, dynamic>{
        'id': 'usr_1',
        'name': 'Ma Aye',
        'email': 'maaye@example.com',
        'phone': '09 7800 1111',
        'locale': 'my',
        'platform_access': <String, dynamic>{
          'role': 'platform_owner',
          'roles': <String>['platform_owner'],
          'permissions': <String>['platform.shops.read'],
        },
        'shops': <Map<String, dynamic>>[
          <String, dynamic>{
            'shop_id': 'shop_1',
            'role': 'owner',
            'roles': <String>['owner'],
            'permissions': <String>['orders.read'],
          },
        ],
      });

      expect(user, isA<AuthUser>());
      expect(user.id, equals('usr_1'));
      expect(user.platformAccess?.role, equals('platform_owner'));
      expect(user.shopAccesses.single.shopId, equals('shop_1'));
    });

    test('AuthSessionModel extends AuthSession and parses auth response', () {
      final session = AuthSessionModel.fromJson(const <String, dynamic>{
        'access_token': 'access-token',
        'refresh_token': 'refresh-token',
        'expires_at': '2026-04-09T16:00:00.000Z',
        'refresh_expires_at': '2026-05-09T16:00:00.000Z',
        'user': <String, dynamic>{
          'id': 'usr_1',
          'name': 'Ma Aye',
          'email': 'maaye@example.com',
          'locale': 'my',
          'shops': <Map<String, dynamic>>[],
        },
      });

      expect(session, isA<AuthSession>());
      expect(session.accessToken, equals('access-token'));
      expect(session.refreshToken, equals('refresh-token'));
      expect(session.user.id, equals('usr_1'));
      expect(session.accessExpiresAt, isNotNull);
      expect(session.refreshExpiresAt, isNotNull);
    });
  });
}
