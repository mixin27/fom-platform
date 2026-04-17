import { Injectable } from '@nestjs/common';
import {
  notFoundError,
  validationError,
} from '../common/http/app-http.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../common/http/request-context';
import {
  type AnnouncementAudience,
  type AnnouncementState,
  announcementAudienceValues,
  announcementSeverityValues,
  announcementStatusValues,
} from './announcement.constants';
import type { CreatePlatformAnnouncementDto } from './dto/create-platform-announcement.dto';
import type { ListPlatformAnnouncementsQueryDto } from './dto/list-platform-announcements-query.dto';
import type { UpdatePlatformAnnouncementDto } from './dto/update-platform-announcement.dto';

type AnnouncementRecord = Awaited<
  ReturnType<AnnouncementsService['loadAnnouncementRecordById']>
>;

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicAnnouncements(audience: 'public' | 'auth') {
    return this.loadActiveAnnouncementsForAudience(audience);
  }

  async listPlatformSurfaceAnnouncements() {
    return this.loadActiveAnnouncementsForAudience('platform');
  }

  async listShopAnnouncements(shopId: string) {
    const [manualAnnouncements, systemAnnouncement] = await Promise.all([
      this.loadActiveAnnouncementsForAudience('tenant'),
      this.buildShopSystemAnnouncement(shopId),
    ]);

    return {
      announcements: systemAnnouncement
        ? [systemAnnouncement, ...manualAnnouncements.announcements]
        : manualAnnouncements.announcements,
    };
  }

  async listPlatformAnnouncements(query: ListPlatformAnnouncementsQueryDto) {
    const rows = await this.prisma.announcement.findMany({
      where: {
        ...(query.search
          ? {
              OR: [
                {
                  title: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
                {
                  body: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
                {
                  ctaLabel: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
        ...(query.audience && query.audience !== 'all'
          ? {
              audiences: {
                has: query.audience,
              },
            }
          : {}),
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { pinned: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const announcements = rows
      .map((row) => this.mapPlatformAnnouncementRow(row))
      .filter(
        (row) => query.state === undefined || query.state === 'all' || row.state === query.state,
      );

    const overviewRows = await this.prisma.announcement.findMany({
      select: {
        status: true,
        startsAt: true,
        endsAt: true,
      },
    });

    const overview = overviewRows.reduce(
      (summary, row) => {
        const state = this.resolveAnnouncementState(row.status, row.startsAt, row.endsAt);
        summary.total += 1;
        summary[state] += 1;
        return summary;
      },
      {
        total: 0,
        active: 0,
        scheduled: 0,
        draft: 0,
        ended: 0,
        archived: 0,
      } satisfies Record<'total' | AnnouncementState, number>,
    );

    return {
      overview,
      announcements,
    };
  }

  async getAnnouncementById(announcementId: string) {
    const row = await this.loadAnnouncementRecordById(announcementId);
    return this.mapPlatformAnnouncementRow(row);
  }

  async createAnnouncement(
    currentUser: AuthenticatedUser,
    body: CreatePlatformAnnouncementDto,
  ) {
    const payload = this.normalizeAnnouncementPayload(body);

    const row = await this.prisma.announcement.create({
      data: {
        ...payload,
        createdByUserId: currentUser.id,
        updatedByUserId: currentUser.id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.mapPlatformAnnouncementRow(row);
  }

  async updateAnnouncement(
    currentUser: AuthenticatedUser,
    announcementId: string,
    body: UpdatePlatformAnnouncementDto,
  ) {
    const existing = await this.loadAnnouncementRecordById(announcementId);

    const payload = this.normalizeAnnouncementPayload({
      title: body.title ?? existing.title,
      body: body.body ?? existing.body,
      severity: body.severity ?? existing.severity,
      status: body.status ?? existing.status,
      audiences: body.audiences ?? existing.audiences,
      cta_label: body.cta_label ?? existing.ctaLabel ?? undefined,
      cta_url: body.cta_url ?? existing.ctaUrl ?? undefined,
      starts_at:
        body.starts_at === undefined
          ? existing.startsAt?.toISOString()
          : body.starts_at,
      ends_at:
        body.ends_at === undefined ? existing.endsAt?.toISOString() : body.ends_at,
      pinned: body.pinned ?? existing.pinned,
      sort_order: body.sort_order ?? existing.sortOrder,
    });

    const row = await this.prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...payload,
        updatedByUserId: currentUser.id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return this.mapPlatformAnnouncementRow(row);
  }

  async deleteAnnouncement(announcementId: string) {
    await this.loadAnnouncementRecordById(announcementId);
    await this.prisma.announcement.delete({
      where: { id: announcementId },
    });
  }

  private async loadActiveAnnouncementsForAudience(audience: AnnouncementAudience) {
    const now = new Date();
    const rows = await this.prisma.announcement.findMany({
      where: {
        status: 'published',
        audiences: {
          has: audience,
        },
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
      orderBy: [
        { pinned: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      announcements: rows.map((row) => this.mapActiveAnnouncementRow(row)),
    };
  }

  private async buildShopSystemAnnouncement(shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        subscription: {
          select: {
            status: true,
            endAt: true,
            plan: {
              select: {
                name: true,
                billingPeriod: true,
              },
            },
            payments: {
              orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
              take: 5,
              select: {
                invoiceNo: true,
                amount: true,
                currency: true,
                status: true,
                dueAt: true,
              },
            },
          },
        },
      },
    });

    const subscription = shop?.subscription;
    if (!subscription) {
      return null;
    }

    const overdueInvoice = subscription.payments.find(
      (payment) => payment.status === 'overdue',
    );
    if (overdueInvoice) {
      return {
        id: `system-overdue-${shopId}`,
        source: 'system',
        title: 'Payment overdue',
        body: `Invoice ${overdueInvoice.invoiceNo} is overdue. Open Billing & Subscription to complete payment and keep access active.`,
        severity: 'critical',
        status: 'system',
        state: 'active',
        audiences: ['tenant'],
        cta_label: 'Open billing',
        cta_url: '/dashboard/billing',
        starts_at: null,
        ends_at: null,
        pinned: true,
        sort_order: -1,
      };
    }

    if (['expired', 'cancelled', 'inactive'].includes(subscription.status)) {
      return {
        id: `system-inactive-${shopId}`,
        source: 'system',
        title: 'Subscription inactive',
        body: `This shop subscription is currently ${subscription.status}. Renew from Billing & Subscription to restore full access.`,
        severity: 'critical',
        status: 'system',
        state: 'active',
        audiences: ['tenant'],
        cta_label: 'Review billing',
        cta_url: '/dashboard/billing',
        starts_at: null,
        ends_at: null,
        pinned: true,
        sort_order: -1,
      };
    }

    if (subscription.status === 'trialing' && subscription.endAt) {
      const now = Date.now();
      const endsAt = subscription.endAt.getTime();
      const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

      if (endsAt <= sevenDaysFromNow) {
        return {
          id: `system-trial-${shopId}`,
          source: 'system',
          title: 'Trial ending soon',
          body: `Your ${subscription.plan.name} trial ends on ${subscription.endAt.toLocaleDateString()}. Review Billing & Subscription to avoid interruption.`,
          severity: 'warning',
          status: 'system',
          state: 'active',
          audiences: ['tenant'],
          cta_label: 'Open billing',
          cta_url: '/dashboard/billing',
          starts_at: null,
          ends_at: null,
          pinned: true,
          sort_order: -1,
        };
      }
    }

    const failedInvoice = subscription.payments.find(
      (payment) => payment.status === 'failed',
    );
    if (failedInvoice) {
      return {
        id: `system-failed-${shopId}`,
        source: 'system',
        title: 'Payment requires attention',
        body: `Invoice ${failedInvoice.invoiceNo} has a failed payment attempt. Retry from Billing & Subscription.`,
        severity: 'warning',
        status: 'system',
        state: 'active',
        audiences: ['tenant'],
        cta_label: 'Retry payment',
        cta_url: '/dashboard/billing',
        starts_at: null,
        ends_at: null,
        pinned: true,
        sort_order: -1,
      };
    }

    return null;
  }

  private async loadAnnouncementRecordById(announcementId: string) {
    const row = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!row) {
      throw notFoundError('Announcement not found');
    }

    return row;
  }

  private normalizeAnnouncementPayload(
    body:
      | CreatePlatformAnnouncementDto
      | (UpdatePlatformAnnouncementDto & CreatePlatformAnnouncementDto),
  ) {
    const normalizedSeverity = (body.severity || 'info').trim().toLowerCase();
    const normalizedStatus = (body.status || 'draft').trim().toLowerCase();
    const normalizedAudiences = [...new Set(body.audiences.map((item) => item.trim().toLowerCase()))];
    const ctaLabel = body.cta_label?.trim() || null;
    const ctaUrl = body.cta_url?.trim() || null;
    const startsAt = this.normalizeOptionalDate(body.starts_at);
    const endsAt = this.normalizeOptionalDate(body.ends_at);

    if (!announcementSeverityValues.includes(normalizedSeverity as any)) {
      throw validationError([
        { field: 'severity', errors: ['Invalid announcement severity.'] },
      ]);
    }

    if (!announcementStatusValues.includes(normalizedStatus as any)) {
      throw validationError([
        { field: 'status', errors: ['Invalid announcement status.'] },
      ]);
    }

    if (normalizedAudiences.length === 0) {
      throw validationError([
        { field: 'audiences', errors: ['Select at least one audience.'] },
      ]);
    }

    const invalidAudiences = normalizedAudiences.filter(
      (item) => !announcementAudienceValues.includes(item as any),
    );
    if (invalidAudiences.length > 0) {
      throw validationError([
        { field: 'audiences', errors: ['One or more audiences are invalid.'] },
      ]);
    }

    if ((ctaLabel && !ctaUrl) || (ctaUrl && !ctaLabel)) {
      throw validationError([
        {
          field: 'cta',
          errors: ['Provide both CTA label and CTA URL, or leave both blank.'],
        },
      ]);
    }

    if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
      throw validationError([
        {
          field: 'ends_at',
          errors: ['End time must be after the start time.'],
        },
      ]);
    }

    return {
      title: body.title.trim(),
      body: body.body.trim(),
      severity: normalizedSeverity,
      status: normalizedStatus,
      audiences: normalizedAudiences,
      ctaLabel,
      ctaUrl,
      startsAt,
      endsAt,
      pinned: body.pinned ?? false,
      sortOrder: body.sort_order ?? 0,
    };
  }

  private normalizeOptionalDate(value: string | undefined) {
    const normalized = value?.trim();
    if (!normalized) {
      return null;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      throw validationError([
        { field: 'dates', errors: ['Announcement dates must be valid.'] },
      ]);
    }

    return parsed;
  }

  private mapPlatformAnnouncementRow(row: AnnouncementRecord) {
    const state = this.resolveAnnouncementState(row.status, row.startsAt, row.endsAt);

    return {
      id: row.id,
      source: 'manual',
      title: row.title,
      body: row.body,
      severity: row.severity,
      status: row.status,
      state,
      audiences: row.audiences,
      cta_label: row.ctaLabel,
      cta_url: row.ctaUrl,
      starts_at: row.startsAt?.toISOString() ?? null,
      ends_at: row.endsAt?.toISOString() ?? null,
      pinned: row.pinned,
      sort_order: row.sortOrder,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
      created_by:
        row.createdByUser
          ? {
              id: row.createdByUser.id,
              name: row.createdByUser.name,
              email: row.createdByUser.email,
            }
          : null,
      updated_by:
        row.updatedByUser
          ? {
              id: row.updatedByUser.id,
              name: row.updatedByUser.name,
              email: row.updatedByUser.email,
            }
          : null,
    };
  }

  private mapActiveAnnouncementRow(row: {
    id: string;
    title: string;
    body: string;
    severity: string;
    status: string;
    audiences: string[];
    ctaLabel: string | null;
    ctaUrl: string | null;
    startsAt: Date | null;
    endsAt: Date | null;
    pinned: boolean;
    sortOrder: number;
  }) {
    return {
      id: row.id,
      source: 'manual',
      title: row.title,
      body: row.body,
      severity: row.severity,
      status: row.status,
      state: 'active',
      audiences: row.audiences,
      cta_label: row.ctaLabel,
      cta_url: row.ctaUrl,
      starts_at: row.startsAt?.toISOString() ?? null,
      ends_at: row.endsAt?.toISOString() ?? null,
      pinned: row.pinned,
      sort_order: row.sortOrder,
    };
  }

  private resolveAnnouncementState(
    status: string,
    startsAt: Date | null,
    endsAt: Date | null,
  ): AnnouncementState {
    if (status === 'archived') {
      return 'archived';
    }

    if (status !== 'published') {
      return 'draft';
    }

    const now = Date.now();
    if (startsAt && startsAt.getTime() > now) {
      return 'scheduled';
    }

    if (endsAt && endsAt.getTime() <= now) {
      return 'ended';
    }

    return 'active';
  }
}
