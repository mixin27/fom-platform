import { Injectable } from '@nestjs/common';
import {
  getConfiguredEmailProvider,
  getDatabaseUrl,
  getNodeEnvironment,
  getPublicApiBaseUrl,
  getWebAppBaseUrl,
  isProductionEnvironment,
  readBooleanEnv,
  readCsvEnv,
  readIntegerEnv,
  readOptionalEnv,
} from './app-env';

export type PublicLaunchConfig = {
  legal: {
    consent_version: string;
    terms_url: string;
    privacy_url: string;
    account_deletion_url: string;
  };
  support: {
    label: string;
    url: string;
  };
  billing: {
    title: string;
    body: string;
    channels: string[];
    contact_label: string;
    contact_url: string;
  };
};

@Injectable()
export class AppConfigService {
  get environment() {
    return getNodeEnvironment();
  }

  isProduction() {
    return isProductionEnvironment();
  }

  getPort() {
    return readIntegerEnv('PORT', 4000, 1);
  }

  getDatabaseUrl() {
    return getDatabaseUrl();
  }

  getPublicApiBaseUrl() {
    return getPublicApiBaseUrl();
  }

  getWebAppBaseUrl() {
    return getWebAppBaseUrl();
  }

  getCorsOrigins() {
    const configuredOrigins = readCsvEnv('CORS_ALLOWED_ORIGINS');

    if (configuredOrigins.length === 0) {
      return this.isProduction() ? false : true;
    }

    return configuredOrigins;
  }

  isApiDocsEnabled() {
    if (readBooleanEnv('API_DOCS_ENABLED', false)) {
      return true;
    }

    return !this.isProduction();
  }

  assertProductionReadiness() {
    if (!this.isProduction()) {
      return;
    }

    const emailProvider = getConfiguredEmailProvider();

    if (['disabled', 'log'].includes(emailProvider)) {
      throw new Error(
        'Production startup blocked: configure EMAIL_PROVIDER to smtp or sendgrid.',
      );
    }

    if (readCsvEnv('CORS_ALLOWED_ORIGINS').length === 0) {
      throw new Error(
        'Production startup blocked: set CORS_ALLOWED_ORIGINS to explicit allowed origins.',
      );
    }
  }

  getPlatformOwner() {
    return {
      email:
        readOptionalEnv('PLATFORM_OWNER_EMAIL', 'PLATFORM_ADMIN_EMAIL')?.toLowerCase() ||
        'owner@fom-platform.local',
      password: process.env.PLATFORM_OWNER_PASSWORD ?? 'Password123!',
      name: readOptionalEnv('PLATFORM_OWNER_NAME') || 'Platform Admin',
    };
  }

  getLegalConfig() {
    const webBaseUrl = this.getWebAppBaseUrl();

    return {
      consent_version:
        readOptionalEnv('LEGAL_CONSENT_VERSION') || '2026-04-16',
      terms_url:
        readOptionalEnv('PUBLIC_TERMS_URL') || `${webBaseUrl}/terms`,
      privacy_url:
        readOptionalEnv('PUBLIC_PRIVACY_URL') || `${webBaseUrl}/privacy`,
      account_deletion_url:
        readOptionalEnv('PUBLIC_ACCOUNT_DELETION_URL') ||
        `${webBaseUrl}/account-deletion`,
    };
  }

  getSupportConfig() {
    const webBaseUrl = this.getWebAppBaseUrl();

    return {
      label: readOptionalEnv('PLATFORM_SUPPORT_LABEL') || 'Contact support',
      url:
        readOptionalEnv('PLATFORM_SUPPORT_URL') || `${webBaseUrl}/contact`,
    };
  }

  getBillingConfig() {
    const support = this.getSupportConfig();
    const paymentChannels = readCsvEnv('PLATFORM_PAYMENT_CHANNELS');

    return {
      title:
        readOptionalEnv('PLATFORM_PAYMENT_INSTRUCTIONS_TITLE') ||
        'How to pay and activate your shop',
      body:
        readOptionalEnv('PLATFORM_PAYMENT_INSTRUCTIONS_BODY') ||
        (this.getMyanmyanpayConfig().isConfigured
          ? 'Open Billing & Subscription, choose the invoice, and pay directly with MyanMyanPay. Your subscription updates automatically after confirmation.'
          : 'Billing is available from the Billing & Subscription page. Configure MyanMyanPay to enable direct payment and automatic activation.'),
      channels: paymentChannels,
      contact_label: support.label,
      contact_url: support.url,
    };
  }

  getPublicLaunchConfig(): PublicLaunchConfig {
    return {
      legal: this.getLegalConfig(),
      support: this.getSupportConfig(),
      billing: this.getBillingConfig(),
    };
  }

  getPublicContactConfig() {
    return {
      inboxEmail:
        readOptionalEnv('PUBLIC_CONTACT_INBOX_EMAIL', 'EMAIL_SUPPORT_EMAIL') ||
        'support@fom-platform.local',
      ipSalt:
        readOptionalEnv('PUBLIC_CONTACT_IP_SALT', 'JWT_ACCESS_SECRET') ||
        'dev_public_contact_salt_change_me',
      ipRateLimit: {
        limit: readIntegerEnv('PUBLIC_CONTACT_RL_IP_LIMIT', 5, 1),
        windowMs: readIntegerEnv(
          'PUBLIC_CONTACT_RL_IP_WINDOW_MS',
          60 * 60 * 1000,
          1,
        ),
      },
      emailRateLimit: {
        limit: readIntegerEnv('PUBLIC_CONTACT_RL_EMAIL_LIMIT', 3, 1),
        windowMs: readIntegerEnv(
          'PUBLIC_CONTACT_RL_EMAIL_WINDOW_MS',
          24 * 60 * 60 * 1000,
          1,
        ),
      },
    };
  }

  getRealtimeConfig() {
    return {
      ticketTtlSeconds: readIntegerEnv('REALTIME_TICKET_TTL_SECONDS', 300, 1),
      jwtSecret: readOptionalEnv('REALTIME_JWT_SECRET'),
    };
  }

  getDefaultTrialDays() {
    return readIntegerEnv('DEFAULT_TRIAL_DAYS', 7, 1);
  }

  getPushProvider() {
    return (
      readOptionalEnv('PUSH_PROVIDER', 'NOTIFICATION_PUSH_PROVIDER')?.toLowerCase() ||
      'disabled'
    );
  }

  getEmailProvider() {
    return getConfiguredEmailProvider();
  }

  getMyanmyanpayConfig() {
    const appId = readOptionalEnv('MYANMYANPAY_APP_ID');
    const apiBaseUrl = readOptionalEnv('MYANMYANPAY_API_BASE_URL');
    const publishableKey = readOptionalEnv(
      'MYANMYANPAY_PUBLISHABLE_KEY',
      'MYANMYANPAY_PUBLIC_KEY',
    );
    const secretKey = readOptionalEnv('MYANMYANPAY_SECRET_KEY');

    return {
      appId,
      apiBaseUrl,
      publishableKey,
      secretKey,
      callbackUrl:
        readOptionalEnv('MYANMYANPAY_CALLBACK_URL') ||
        `${this.getPublicApiBaseUrl()}/api/v1/payments/webhooks/myanmyanpay`,
      useSandbox: readBooleanEnv('MYANMYANPAY_USE_SANDBOX', false),
      qrExpirySeconds: readIntegerEnv('MYANMYANPAY_QR_EXPIRY_SECONDS', 900, 60),
      isConfigured: Boolean(appId && apiBaseUrl && publishableKey && secretKey),
    };
  }

  getMetaMessengerConfig() {
    const graphApiBaseUrl =
      readOptionalEnv('META_GRAPH_API_BASE_URL') || 'https://graph.facebook.com';
    const graphApiVersion = readOptionalEnv('META_GRAPH_API_VERSION') || 'v25.0';
    const appSecret = readOptionalEnv('META_APP_SECRET');
    const webhookVerifyToken = readOptionalEnv('META_WEBHOOK_VERIFY_TOKEN');
    const tokenEncryptionSecret =
      readOptionalEnv(
        'MESSENGER_TOKEN_ENCRYPTION_SECRET',
        'JWT_ACCESS_SECRET',
      ) || 'dev_messenger_token_encryption_secret_change_me';

    return {
      graphApiBaseUrl: graphApiBaseUrl.replace(/\/+$/, ''),
      graphApiVersion: graphApiVersion.replace(/^\/+/, ''),
      appSecret,
      webhookVerifyToken,
      webhookUrl: `${this.getPublicApiBaseUrl()}/api/v1/messenger/webhooks/meta`,
      tokenEncryptionSecret,
      isWebhookVerificationConfigured: Boolean(webhookVerifyToken),
      isSignatureValidationConfigured: Boolean(appSecret),
    };
  }
}
