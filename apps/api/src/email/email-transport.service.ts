import { Injectable } from '@nestjs/common';
import { DisabledEmailProvider } from './providers/disabled-email.provider';
import { LogEmailProvider } from './providers/log-email.provider';
import { SendgridEmailProvider } from './providers/sendgrid-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import type {
  EmailProvider,
  EmailProviderSendInput,
  EmailProviderSendResult,
} from './email.types';

@Injectable()
export class EmailTransportService {
  private readonly providers: Map<string, EmailProvider>;

  constructor(
    disabledProvider: DisabledEmailProvider,
    logProvider: LogEmailProvider,
    sendgridProvider: SendgridEmailProvider,
    smtpProvider: SmtpEmailProvider,
  ) {
    this.providers = new Map(
      [disabledProvider, logProvider, sendgridProvider, smtpProvider].map((provider) => [
        provider.key,
        provider,
      ]),
    );
  }

  getActiveProviderKey() {
    const configuredKey =
      process.env.EMAIL_PROVIDER?.trim().toLowerCase() ||
      process.env.EMAIL_DELIVERY_MODE?.trim().toLowerCase() ||
      'log';

    return this.providers.has(configuredKey) ? configuredKey : 'log';
  }

  getDefaultSender() {
    return {
      fromEmail:
        process.env.EMAIL_FROM_EMAIL?.trim() ||
        process.env.EMAIL_SENDGRID_FROM_EMAIL?.trim() ||
        process.env.EMAIL_SMTP_FROM_EMAIL?.trim() ||
        'no-reply@fom-platform.local',
      fromName:
        process.env.EMAIL_FROM_NAME?.trim() ||
        process.env.EMAIL_SENDGRID_FROM_NAME?.trim() ||
        process.env.EMAIL_SMTP_FROM_NAME?.trim() ||
        'FOM Order Manager',
    };
  }

  async send(message: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const provider = this.providers.get(this.getActiveProviderKey()) ?? this.providers.get('log');
    if (!provider) {
      throw new Error('No email provider is available');
    }

    return provider.send(message);
  }
}
