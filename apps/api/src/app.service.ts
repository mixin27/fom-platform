import { Injectable } from '@nestjs/common';
import { AppConfigService } from './config/app-config.service';
import {
  defaultRoleCatalog,
  permissionCatalog,
} from './common/http/rbac.constants';

@Injectable()
export class AppService {
  constructor(private readonly config: AppConfigService) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'facebook-order-manager-api',
      version: '0.1.0',
      environment: this.config.environment,
      timestamp: new Date().toISOString(),
    };
  }

  getOverview() {
    const platformOwner = this.config.getPlatformOwner();
    const docsEnabled = this.isApiDocsEnabled();
    const isProduction = this.isProduction();

    return {
      name: 'facebook-order-manager-api',
      version: '0.1.0',
      base_url: '/api/v1',
      auth: {
        type: 'bearer-jwt',
        methods: ['email_password', 'phone_otp', 'google', 'facebook'],
        jwt_claims: [
          'sub',
          'sid',
          'platform.roles',
          'platform.permissions',
          'shops.roles',
          'shops.permissions',
        ],
        ...(isProduction
          ? {}
          : {
              demo_credentials: {
                platform_owner_email: platformOwner.email,
                platform_owner_password: platformOwner.password,
                owner_email: 'maaye@example.com',
                owner_password: 'Password123!',
                staff_email: 'komin@example.com',
                staff_password: 'Password123!',
              },
            }),
        otp_note:
          'Use debug_otp_code from /api/v1/auth/phone/start in development',
      },
      storage: {
        database: 'postgresql',
        orm: 'prisma',
      },
      docs: {
        enabled: docsEnabled,
        ...(docsEnabled
          ? {
              swagger_ui: '/docs',
              openapi_json: '/openapi.json',
              openapi_yaml: '/openapi.yaml',
              scalar: '/reference',
            }
          : {}),
      },
      scope: {
        implemented: [
          'auth',
          'users.me',
          'platform dashboard',
          'platform shops',
          'platform subscriptions',
          'platform support',
          'platform settings',
          'shops',
          'shop members',
          'customers',
          'orders',
          'messenger order parsing',
          'order items',
          'order status updates',
          'deliveries',
          'message templates',
          'daily summaries',
          'weekly reports',
          'monthly reports',
        ],
        deferred: [],
      },
      rbac: {
        roles: defaultRoleCatalog,
        permissions: permissionCatalog,
      },
    };
  }

  getPublicLaunchConfig() {
    return this.config.getPublicLaunchConfig();
  }

  isApiDocsEnabled() {
    return this.config.isApiDocsEnabled();
  }

  private isProduction() {
    return this.config.isProduction();
  }
}
