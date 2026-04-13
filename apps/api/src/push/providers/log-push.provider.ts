import { Injectable, Logger } from '@nestjs/common';
import type { PushDispatchMessage, PushDispatchResult } from '../push.types';

@Injectable()
export class LogPushProvider {
  readonly key = 'log';
  private readonly logger = new Logger(LogPushProvider.name);

  async send(messages: PushDispatchMessage[]): Promise<PushDispatchResult[]> {
    return messages.map((message) => {
      const providerMessageId = `push_${message.device_id}_${Date.now()}`;
      this.logger.log(
        `Push notification queued for ${message.platform}:${message.device_id} -> ${message.title}`,
      );

      return {
        device_id: message.device_id,
        delivered: true,
        provider_message_id: providerMessageId,
        error: null,
      };
    });
  }
}
