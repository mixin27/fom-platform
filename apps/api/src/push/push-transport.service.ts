import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { DisabledPushProvider } from './providers/disabled-push.provider';
import { FcmPushProvider } from './providers/fcm-push.provider';
import { LogPushProvider } from './providers/log-push.provider';
import type { PushDispatchMessage, PushDispatchResult } from './push.types';

@Injectable()
export class PushTransportService {
  constructor(
    private readonly config: AppConfigService,
    private readonly disabledProvider: DisabledPushProvider,
    private readonly fcmProvider: FcmPushProvider,
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
    const configuredProvider = this.config.getPushProvider();

    switch (configuredProvider) {
      case this.fcmProvider.key:
        return this.fcmProvider;
      case this.logProvider.key:
        return this.logProvider;
      case this.disabledProvider.key:
      default:
        return this.disabledProvider;
    }
  }
}
