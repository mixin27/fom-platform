import { Injectable } from '@nestjs/common';
import { rolePermissions } from './common/http/rbac.constants';

@Injectable()
export class AppService {
  getOverview() {
    return {
      name: 'facebook-order-manager-api',
      version: '0.1.0',
      base_url: '/api/v1',
      auth: {
        type: 'bearer-session',
        demo_owner_token: 'tok_demo_owner',
        otp_note:
          'Use debug_otp_code from /api/v1/auth/phone/start in development',
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
      rbac: rolePermissions,
    };
  }
}
