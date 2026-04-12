import { Injectable } from '@nestjs/common';
import sendgridMail from '@sendgrid/mail';
import type {
  EmailProvider,
  EmailProviderSendInput,
  EmailProviderSendResult,
} from '../email.types';

@Injectable()
export class SendgridEmailProvider implements EmailProvider {
  readonly key = 'sendgrid';
  private configuredApiKey: string | null = null;

  async send(message: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    const apiKey = this.readApiKey();
    if (this.configuredApiKey !== apiKey) {
      sendgridMail.setApiKey(apiKey);
      this.configuredApiKey = apiKey;
    }

    const [response] = await sendgridMail.send({
      to: {
        email: message.toEmail,
        name: message.recipientName ?? undefined,
      },
      from: {
        email: message.fromEmail,
        name: message.fromName ?? undefined,
      },
      replyTo: message.replyToEmail
        ? {
            email: message.replyToEmail,
            name: message.replyToName ?? undefined,
          }
        : undefined,
      subject: message.subject,
      text: message.textBody,
      html: message.htmlBody ?? undefined,
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: false,
        },
        openTracking: {
          enable: true,
        },
      },
    });

    return {
      providerKey: this.key,
      providerMessageId: this.readResponseHeader(response?.headers, 'x-message-id'),
      status: 'sent',
      metadata: {
        statusCode: response?.statusCode ?? null,
      },
    };
  }

  private readApiKey() {
    const apiKey = process.env.SENDGRID_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('SendGrid email provider requires SENDGRID_API_KEY');
    }

    return apiKey;
  }

  private readResponseHeader(
    headers: Record<string, unknown> | undefined,
    key: string,
  ) {
    const value = headers?.[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }
}
