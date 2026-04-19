import { Injectable } from '@nestjs/common';
import { notFoundError } from '../common/http/app-http.exception';
import type { AuthenticatedUser } from '../common/http/request-context';
import type { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

type AuditDbClient = Prisma.TransactionClient | PrismaService;

type AuditLogRecord = Prisma.ShopAuditLogGetPayload<{
  include: {
    actorUser: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

@Injectable()
export class ShopAuditLogService {
  async listGovernanceRecords(db: AuditDbClient, shopId: string) {
    return db.shopAuditLog.findMany({
      where: {
        shopId,
        entityType: {
          in: ['role', 'shop_member'],
        },
      },
      include: {
        actorUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async listOrderRecords(db: AuditDbClient, shopId: string, orderId: string) {
    return db.shopAuditLog.findMany({
      where: {
        shopId,
        entityType: 'order',
        entityId: orderId,
      },
      include: {
        actorUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  serializeRecord(record: AuditLogRecord | null) {
    if (!record) {
      throw notFoundError('Shop audit log not found');
    }

    return {
      id: record.id,
      shop_id: record.shopId,
      action: record.action,
      entity_type: record.entityType,
      entity_id: record.entityId,
      summary: record.summary,
      metadata: record.metadata ?? null,
      created_at: record.createdAt.toISOString(),
      actor: record.actorUser
        ? {
            id: record.actorUser.id,
            name: record.actorUser.name,
          }
        : record.actorNameSnapshot
          ? {
              id: null,
              name: record.actorNameSnapshot,
            }
          : null,
    };
  }

  async record(
    tx: Prisma.TransactionClient,
    input: {
      shopId: string;
      actorUser: AuthenticatedUser;
      action: string;
      entityType: string;
      entityId?: string | null;
      summary: string;
      metadata?: Prisma.InputJsonValue | null;
    },
  ) {
    await tx.shopAuditLog.create({
      data: {
        shopId: input.shopId,
        actorUserId: input.actorUser.id,
        actorNameSnapshot: input.actorUser.name,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        ...(input.metadata !== undefined
          ? { metadata: input.metadata ?? Prisma.JsonNull }
          : {}),
      },
    });
  }
}
