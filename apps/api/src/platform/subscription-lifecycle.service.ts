import { Injectable } from '@nestjs/common';
import { conflictError } from '../common/http/app-http.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { DEFAULT_TRIAL_PLAN_CODE } from './platform-billing.constants';

type TrialSubscriptionOptions = {
  required?: boolean;
  referenceDate?: Date;
};

@Injectable()
export class SubscriptionLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  getDefaultTrialDurationDays() {
    const parsed = Number.parseInt(process.env.DEFAULT_TRIAL_DAYS ?? '7', 10);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 7;
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

  async expireElapsedTrials(referenceDate = new Date()) {
    const result = await (this.prisma as any).subscription.updateMany({
      where: {
        status: 'trialing',
        endAt: {
          not: null,
          lte: referenceDate,
        },
        plan: {
          is: {
            billingPeriod: 'trial',
          },
        },
      },
      data: {
        status: 'expired',
        autoRenews: false,
      },
    });

    return result.count;
  }
}
