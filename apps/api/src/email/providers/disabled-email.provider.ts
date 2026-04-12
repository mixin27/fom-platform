import { Injectable } from '@nestjs/common';
import type {
  EmailProvider,
  EmailProviderSendInput,
  EmailProviderSendResult,
} from '../email.types';

@Injectable()
export class DisabledEmailProvider implements EmailProvider {
  readonly key = 'disabled';

  async send(_message: EmailProviderSendInput): Promise<EmailProviderSendResult> {
    return {
      providerKey: this.key,
      providerMessageId: null,
      status: 'skipped',
      failureReason: 'Email delivery is disabled by configuration.',
    };
  }
}
