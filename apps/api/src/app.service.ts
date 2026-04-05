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
        type: 'bearer-access-token',
        methods: ['email_password', 'phone_otp', 'google', 'facebook'],
        demo_owner_access_token: 'atk_demo_owner',
        demo_owner_refresh_token: 'rtk_demo_owner',
        otp_note:
          'Use debug_otp_code from /api/v1/auth/phone/start in development',
      },
      storage: {
        database: 'postgresql',
        orm: 'prisma',
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
          'daily summaries',
        ],
        deferred: [
          'deliveries',
          'message templates',
          'weekly reports',
          'monthly reports',
        ],
      },
      rbac: {
        roles: defaultRoleCatalog,
        permissions: permissionCatalog,
      },
    };
  }
}
