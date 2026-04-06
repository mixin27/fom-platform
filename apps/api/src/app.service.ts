import { Injectable } from '@nestjs/common';
import {
  defaultRoleCatalog,
  permissionCatalog,
} from './common/http/rbac.constants';

@Injectable()
export class AppService {
  getOverview() {
    return {
      name: 'facebook-order-manager-api',
      version: '0.1.0',
      base_url: '/api/v1',
      auth: {
        type: 'bearer-jwt',
        methods: ['email_password', 'phone_otp', 'google', 'facebook'],
        jwt_claims: ['sub', 'sid', 'shops.roles', 'shops.permissions'],
        demo_credentials: {
          owner_email: 'maaye@example.com',
          owner_password: 'Password123!',
          staff_email: 'komin@example.com',
          staff_password: 'Password123!',
        },
        otp_note:
          'Use debug_otp_code from /api/v1/auth/phone/start in development',
      },
      storage: {
        database: 'postgresql',
        orm: 'prisma',
      },
      docs: {
        swagger_ui: '/docs',
        openapi_json: '/openapi.json',
        openapi_yaml: '/openapi.yaml',
        scalar: '/reference',
      },
      scope: {
        implemented: [
          'auth',
          'users.me',
          'shops',
          'shop members',
          'customers',
          'orders',
          'order items',
          'order status updates',
          'message templates',
          'daily summaries',
          'weekly reports',
          'monthly reports',
        ],
        deferred: ['deliveries'],
      },
      rbac: {
        roles: defaultRoleCatalog,
        permissions: permissionCatalog,
      },
    };
  }
}
