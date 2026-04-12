import { Injectable } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type {
  EmailProvider,
  EmailProviderSendInput,
  EmailProviderSendResult,
} from '../email.types';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  readonly key = 'smtp';
  private transporter: Transporter | null = null;

  async send(message: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const transporter = this.getTransporter();
    const replyTo =
      message.replyToEmail && message.replyToName
        ? `"${message.replyToName}" <${message.replyToEmail}>`
        : message.replyToEmail ?? undefined;

    const result = await transporter.sendMail({
      to: this.formatAddress(message.toEmail, message.recipientName),
      from: this.formatAddress(message.fromEmail, message.fromName),
      replyTo,
      subject: message.subject,
      text: message.textBody,
      html: message.htmlBody ?? undefined,
    });

    return {
      providerKey: this.key,
      providerMessageId: result.messageId ?? null,
      status: 'sent',
      metadata: {
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response,
      },
    };
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.readRequiredEnv('EMAIL_SMTP_HOST', 'SMTP_HOST');
    const port = this.readIntegerEnv('EMAIL_SMTP_PORT', 'SMTP_PORT', 587);
    const secure = this.readBooleanEnv('EMAIL_SMTP_SECURE', false);
    const user = this.readOptionalEnv('EMAIL_SMTP_USER', 'SMTP_USER');
    const pass = this.readOptionalEnv('EMAIL_SMTP_PASSWORD', 'SMTP_PASSWORD');
    const ignoreTLS = this.readBooleanEnv('EMAIL_SMTP_IGNORE_TLS', false);
    const requireTLS = this.readBooleanEnv('EMAIL_SMTP_REQUIRE_TLS', false);

    this.transporter = createTransport({
      host,
      port,
      secure,
      ignoreTLS,
      requireTLS,
      ...(user
        ? {
            auth: {
              user,
              pass: pass ?? '',
            },
          }
        : {}),
    });

    return this.transporter;
  }

  private formatAddress(email: string, name?: string | null) {
    return name?.trim() ? `"${name.trim()}" <${email}>` : email;
  }

  private readRequiredEnv(...keys: string[]) {
    const value = this.readOptionalEnv(...keys);
    if (!value) {
      throw new Error(
        `SMTP email provider requires one of these environment variables: ${keys.join(', ')}`,
      );
    }

    return value;
  }

  private readOptionalEnv(...keys: string[]) {
    for (const key of keys) {
      const value = process.env[key]?.trim();
      if (value) {
        return value;
      }
    }

    return null;
  }

  private readIntegerEnv(
    primaryKey: string,
    fallbackKey: string,
    fallbackValue: number,
  ) {
    const rawValue = this.readOptionalEnv(primaryKey, fallbackKey);
    if (!rawValue) {
      return fallbackValue;
    }

    const parsed = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsed) ? parsed : fallbackValue;
  }

  private readBooleanEnv(key: string, fallbackValue: boolean) {
    const rawValue = process.env[key]?.trim().toLowerCase();
    if (!rawValue) {
      return fallbackValue;
    }

    return ['1', 'true', 'yes', 'on'].includes(rawValue);
  }
}
