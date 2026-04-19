import { Injectable } from '@nestjs/common';
import { notFoundError } from '../common/http/app-http.exception';
import type { AuthenticatedUser } from '../common/http/request-context';
import { PrismaService } from '../common/prisma/prisma.service';
import { PushTransportService } from './push-transport.service';
import type { RegisterPushDeviceDto } from './dto/register-push-device.dto';
import type { PushDispatchResult } from './push.types';

@Injectable()
export class PushService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushTransportService: PushTransportService,
  ) {}

  async registerDevice(
    currentUser: AuthenticatedUser,
    body: RegisterPushDeviceDto,
  ) {
    const sessionId = currentUser.sessionId?.trim() || null;
    const normalizedDeviceId = body.device_id.trim();
    const normalizedProvider = body.provider.trim().toLowerCase();
    const normalizedPlatform = body.platform.trim().toLowerCase();
    const normalizedToken = body.push_token.trim();

    await this.prisma.pushDevice.deleteMany({
      where: {
        pushToken: normalizedToken,
        NOT: {
          userId: currentUser.id,
        },
      },
    });

    const existing = await this.prisma.pushDevice.findUnique({
      where: {
        userId_deviceId_provider: {
          userId: currentUser.id,
          deviceId: normalizedDeviceId,
          provider: normalizedProvider,
        },
      },
    });

    const device = existing
      ? await this.prisma.pushDevice.update({
          where: { id: existing.id },
          data: {
            sessionId,
            platform: normalizedPlatform,
            pushToken: normalizedToken,
            deviceName: body.device_name?.trim() || null,
            appVersion: body.app_version?.trim() || null,
            locale: body.locale?.trim() || null,
            isActive: true,
            lastSeenAt: new Date(),
          },
        })
      : await this.prisma.pushDevice.create({
          data: {
            userId: currentUser.id,
            sessionId,
            deviceId: normalizedDeviceId,
            provider: normalizedProvider,
            platform: normalizedPlatform,
            pushToken: normalizedToken,
            deviceName: body.device_name?.trim() || null,
            appVersion: body.app_version?.trim() || null,
            locale: body.locale?.trim() || null,
            isActive: true,
            lastSeenAt: new Date(),
          },
        });

    return this.serializePushDevice(device);
  }

  async unregisterDevice(currentUser: AuthenticatedUser, deviceId: string) {
    const result = await this.prisma.pushDevice.updateMany({
      where: {
        userId: currentUser.id,
        deviceId,
      },
      data: {
        isActive: false,
      },
    });

    if (result.count === 0) {
      throw notFoundError('Push device not found');
    }

    return {
      device_id: deviceId,
      unregistered: true,
    };
  }

  async sendNotificationToUser(input: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    const devices = await this.prisma.pushDevice.findMany({
      where: {
        userId: input.userId,
        isActive: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    if (devices.length === 0) {
      return [];
    }

    const results = await this.pushTransportService.dispatch(
      devices.map((device) => ({
        device_id: device.deviceId,
        provider: device.provider,
        platform: device.platform,
        push_token: device.pushToken,
        title: input.title,
        body: input.body,
        data: input.data,
      })),
    );

    const staleDeviceIds = results
      .filter((result) => this.shouldDeactivateDevice(result))
      .map((result) => result.device_id);

    if (staleDeviceIds.length > 0) {
      await this.prisma.pushDevice.updateMany({
        where: {
          userId: input.userId,
          deviceId: {
            in: staleDeviceIds,
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    return results;
  }

  private serializePushDevice(device: {
    id: string;
    userId: string;
    sessionId: string | null;
    deviceId: string;
    provider: string;
    platform: string;
    deviceName: string | null;
    appVersion: string | null;
    locale: string | null;
    isActive: boolean;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: device.id,
      user_id: device.userId,
      session_id: device.sessionId,
      device_id: device.deviceId,
      provider: device.provider,
      platform: device.platform,
      device_name: device.deviceName,
      app_version: device.appVersion,
      locale: device.locale,
      is_active: device.isActive,
      last_seen_at: device.lastSeenAt.toISOString(),
      created_at: device.createdAt.toISOString(),
      updated_at: device.updatedAt.toISOString(),
    };
  }

  private shouldDeactivateDevice(result: PushDispatchResult) {
    const normalizedError = result.error?.trim().toLowerCase() ?? '';
    return (
      normalizedError === 'messaging/invalid-registration-token' ||
      normalizedError === 'messaging/registration-token-not-registered'
    );
  }
}
