import { Injectable } from '@nestjs/common';
import { conflictError } from '../common/http/app-http.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
import { DEFAULT_TRIAL_PLAN_CODE } from './platform-billing.constants';

type TrialSubscriptionOptions = {
  required?: boolean;
  referenceDate?: Date;
};

@Injectable()
export class SubscriptionLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  getDefaultTrialDurationDays() {
    return this.config.getDefaultTrialDays();
  }

  buildTrialWindow(referenceDate = new Date()) {
    const startAt = new Date(referenceDate);
    const endAt = new Date(referenceDate);
    endAt.setDate(endAt.getDate() + this.getDefaultTrialDurationDays());

    return {
      startAt,
      endAt,
    };
  }

  async createDefaultTrialSubscription(
    tx: any,
    shopId: string,
    options: TrialSubscriptionOptions = {},
  ) {
    const trialPlan = await (tx as any).plan.findUnique({
      where: { code: DEFAULT_TRIAL_PLAN_CODE },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!trialPlan || !trialPlan.isActive) {
      if (options.required) {
        throw conflictError(
          'Free trial is not available right now. Enable the trial plan first.',
        );
      }

      return null;
    }

    const { startAt, endAt } = this.buildTrialWindow(options.referenceDate);

    return (tx as any).subscription.create({
      data: {
        shopId,
        planId: trialPlan.id,
        status: 'trialing',
        startAt,
        endAt,
        autoRenews: false,
      },
    });
  }

  async processSubscriptionExpirations(referenceDate = new Date()) {
    const gracePeriodEnd = new Date(referenceDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() - 3);

    // Stage 1: Active/Trialing subscriptions that have reached endAt -> Overdue
    const overdueCount = await (this.prisma as any).subscription.updateMany({
      where: {
        status: { in: ['active', 'trialing'] },
        endAt: {
          not: null,
          lte: referenceDate,
        },
      },
      data: {
        status: 'overdue',
        autoRenews: false,
      },
    });

    // Stage 2: Overdue subscriptions that have exceeded the 3-day grace period -> Expired
    const expiredCount = await (this.prisma as any).subscription.updateMany({
      where: {
        status: 'overdue',
        endAt: {
          not: null,
          lte: gracePeriodEnd,
        },
      },
      data: {
        status: 'expired',
        autoRenews: false,
      },
    });

    return {
      overdue: overdueCount.count,
      expired: expiredCount.count,
    };
  }
}
