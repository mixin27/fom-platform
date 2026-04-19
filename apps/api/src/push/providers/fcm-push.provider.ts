import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import type { PushDispatchMessage, PushDispatchResult } from '../push.types';

@Injectable()
export class FcmPushProvider {
  readonly key = 'fcm';
  private readonly logger = new Logger(FcmPushProvider.name);
  private app: App | null = null;

  constructor(private readonly config: AppConfigService) {}

  async send(messages: PushDispatchMessage[]): Promise<PushDispatchResult[]> {
    const app = this.resolveFirebaseApp();
    if (!app) {
      return messages.map((message) => ({
        device_id: message.device_id,
        delivered: false,
        provider_message_id: null,
        error: 'fcm/not-configured',
      }));
    }

    const messaging = getMessaging(app);
    const results = await Promise.all(
      messages.map(async (message) => {
        try {
          const providerMessageId = await messaging.send({
            token: message.push_token,
            notification: {
              title: message.title,
              body: message.body,
            },
            data: message.data,
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
              },
            },
            apns: {
              headers: {
                'apns-priority': '10',
              },
              payload: {
                aps: {
                  sound: 'default',
                },
              },
            },
          });

          return {
            device_id: message.device_id,
            delivered: true,
            provider_message_id: providerMessageId,
            error: null,
          };
        } catch (error) {
          const errorCode = this.extractErrorCode(error);
          const errorMessage = this.extractErrorMessage(error);
          this.logger.warn(
            `FCM send failed for ${message.platform}:${message.device_id}: ${errorCode ?? errorMessage}`,
          );

          return {
            device_id: message.device_id,
            delivered: false,
            provider_message_id: null,
            error: errorCode ?? errorMessage ?? 'fcm/send-failed',
          };
        }
      }),
    );

    return results;
  }

  private resolveFirebaseApp() {
    if (this.app) {
      return this.app;
    }

    const firebaseConfig = this.config.getFirebaseAdminConfig();
    if (!firebaseConfig.isConfigured || !firebaseConfig.serviceAccount) {
      this.logger.warn(
        firebaseConfig.errorMessage ??
          'FCM push provider selected but Firebase Admin credentials are not configured.',
      );
      return null;
    }

    const existing = getApps().find((app) => app.name === 'fom-push');
    if (existing) {
      this.app = existing;
      return existing;
    }

    this.app = initializeApp(
      {
        credential: cert(firebaseConfig.serviceAccount),
        projectId: firebaseConfig.serviceAccount.projectId,
      },
      'fom-push',
    );
    return this.app;
  }

  private extractErrorCode(error: unknown) {
    if (!error || typeof error !== 'object' || !('code' in error)) {
      return null;
    }

    const code = error.code;
    return typeof code === 'string' && code.trim().length > 0
      ? code.trim()
      : null;
  }

  private extractErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message.trim();
    }

    return null;
  }
}
