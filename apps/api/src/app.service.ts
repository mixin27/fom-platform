import { Injectable } from '@nestjs/common';
import {
  defaultRoleCatalog,
  permissionCatalog,
} from './common/http/rbac.constants';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'facebook-order-manager-api',
      version: '0.1.0',
      environment: process.env.NODE_ENV?.trim() || 'development',
      timestamp: new Date().toISOString(),
    };
  }

  getOverview() {
    const platformOwnerEmail =
      process.env.PLATFORM_OWNER_EMAIL?.trim().toLowerCase() ||
      process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() ||
      'owner@fom-platform.local';
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
                platform_owner_email: platformOwnerEmail,
                platform_owner_password:
                  process.env.PLATFORM_OWNER_PASSWORD ?? 'Password123!',
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
    const webBaseUrl = this.getWebAppBaseUrl();
    const hasMyanmyanpay =
      Boolean(process.env.MYANMYANPAY_APP_ID?.trim()) &&
      Boolean(process.env.MYANMYANPAY_SECRET_KEY?.trim()) &&
      Boolean(
        process.env.MYANMYANPAY_PUBLISHABLE_KEY?.trim() ||
          process.env.MYANMYANPAY_PUBLIC_KEY?.trim(),
      ) &&
      Boolean(process.env.MYANMYANPAY_API_BASE_URL?.trim());
    const noticeEnabled = this.readBoolEnv('PLATFORM_NOTICE_ENABLED', false);
    const noticeTitle = process.env.PLATFORM_NOTICE_TITLE?.trim() || '';
    const noticeBody = process.env.PLATFORM_NOTICE_BODY?.trim() || '';
    const noticeCtaLabel = process.env.PLATFORM_NOTICE_CTA_LABEL?.trim() || '';
    const noticeCtaUrl = process.env.PLATFORM_NOTICE_CTA_URL?.trim() || '';
    const paymentChannels = (process.env.PLATFORM_PAYMENT_CHANNELS ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const supportLabel =
      process.env.PLATFORM_SUPPORT_LABEL?.trim() || 'Contact support';
    const supportUrl =
      process.env.PLATFORM_SUPPORT_URL?.trim() || `${webBaseUrl}/contact`;

    return {
      legal: {
        consent_version:
          process.env.LEGAL_CONSENT_VERSION?.trim() || '2026-04-16',
        terms_url:
          process.env.PUBLIC_TERMS_URL?.trim() || `${webBaseUrl}/terms`,
        privacy_url:
          process.env.PUBLIC_PRIVACY_URL?.trim() || `${webBaseUrl}/privacy`,
        account_deletion_url:
          process.env.PUBLIC_ACCOUNT_DELETION_URL?.trim() ||
          `${webBaseUrl}/account-deletion`,
      },
      notice: {
        enabled:
          noticeEnabled && noticeTitle.length > 0 && noticeBody.length > 0,
        severity:
          process.env.PLATFORM_NOTICE_SEVERITY?.trim().toLowerCase() || 'info',
        audience:
          process.env.PLATFORM_NOTICE_AUDIENCE?.trim().toLowerCase() || 'all',
        title: noticeTitle,
        body: noticeBody,
        cta_label: noticeCtaLabel || null,
        cta_url: noticeCtaUrl || null,
      },
      support: {
        label: supportLabel,
        url: supportUrl,
      },
      billing: {
        title:
          process.env.PLATFORM_PAYMENT_INSTRUCTIONS_TITLE?.trim() ||
          'How to pay and activate your shop',
        body:
          process.env.PLATFORM_PAYMENT_INSTRUCTIONS_BODY?.trim() ||
          (hasMyanmyanpay
            ? 'Open Billing & Subscription, choose the invoice, and pay directly with MyanMyanPay. Your subscription updates automatically after confirmation.'
            : 'Billing is available from the Billing & Subscription page. Configure MyanMyanPay to enable direct payment and automatic activation.'),
        channels: paymentChannels,
        contact_label: supportLabel,
        contact_url: supportUrl,
      },
    };
  }

  isApiDocsEnabled() {
    if (process.env.API_DOCS_ENABLED?.trim().toLowerCase() === 'true') {
      return true;
    }

    return !this.isProduction();
  }

  private isProduction() {
    return (process.env.NODE_ENV?.trim().toLowerCase() || '') === 'production';
  }

  private getWebAppBaseUrl() {
    return (
      process.env.WEB_APP_BASE_URL?.trim() ||
      process.env.APP_WEB_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
      'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  private readBoolEnv(name: string, fallback: boolean) {
    const rawValue = process.env[name]?.trim().toLowerCase();
    if (!rawValue) {
      return fallback;
    }

    return ['1', 'true', 'yes', 'on'].includes(rawValue);
  }
}
