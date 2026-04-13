import { Injectable } from '@nestjs/common';
import type { PushDispatchMessage, PushDispatchResult } from '../push.types';

@Injectable()
export class DisabledPushProvider {
  readonly key = 'disabled';

  async send(messages: PushDispatchMessage[]): Promise<PushDispatchResult[]> {
    return messages.map((message) => ({
      device_id: message.device_id,
      delivered: false,
      error: 'Push provider is disabled',
      provider_message_id: null,
    }));
  }
}
