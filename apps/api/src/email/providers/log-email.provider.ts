import { Injectable, Logger } from '@nestjs/common';
import { generateId } from '../../common/utils/id';
import type {
  EmailProvider,
  EmailProviderSendInput,
  EmailProviderSendResult,
} from '../email.types';

@Injectable()
export class LogEmailProvider implements EmailProvider {
  readonly key = 'log';
  private readonly logger = new Logger(LogEmailProvider.name);

  async send(message: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    this.logger.log(
      [
        `[email:${message.messageId}] to=${message.toEmail} subject="${message.subject}"`,
        message.textBody,
      ].join('\n\n'),
    );

    return {
      providerKey: this.key,
      providerMessageId: generateId('email'),
      status: 'sent',
    };
  }
}
