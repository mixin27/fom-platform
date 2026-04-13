import { Injectable } from '@nestjs/common';
import { DisabledPushProvider } from './providers/disabled-push.provider';
import { LogPushProvider } from './providers/log-push.provider';
import type { PushDispatchMessage, PushDispatchResult } from './push.types';

@Injectable()
export class PushTransportService {
  constructor(
    private readonly disabledProvider: DisabledPushProvider,
    private readonly logProvider: LogPushProvider,
  ) {}

  async dispatch(
    messages: PushDispatchMessage[],
  ): Promise<PushDispatchResult[]> {
    if (messages.length === 0) {
      return [];
    }

    return this.resolveProvider().send(messages);
  }

  private resolveProvider() {
    const configuredProvider =
      process.env.PUSH_PROVIDER?.trim().toLowerCase() ??
      process.env.NOTIFICATION_PUSH_PROVIDER?.trim().toLowerCase() ??
      'disabled';

    switch (configuredProvider) {
      case this.logProvider.key:
        return this.logProvider;
      case this.disabledProvider.key:
      default:
        return this.disabledProvider;
    }
  }
}
