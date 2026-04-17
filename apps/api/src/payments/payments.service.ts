import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { platformSubscriptionStatuses } from '../platform/platform-billing.constants';
import { MyanmyanpayService } from './myanmyanpay.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly myanmyanpay: MyanmyanpayService,
  ) {}

  async handleMyanmyanpayWebhook(input: {
    body: Record<string, unknown>;
    rawBody: string;
    signature?: string;
    nonce?: string;
  }) {
    const payload = this.normalizePayload(input.body, input.rawBody);
    const signatureValid = await this.myanmyanpay.verifyCallback(
      input.rawBody,
      input.nonce,
      input.signature,
    );
    const eventId = this.resolveEventId(payload, input);

    let webhookEvent =
      eventId === null
        ? null
        : await this.prisma.paymentWebhookEvent.findUnique({
            where: {
              provider_eventId: {
                provider: 'myanmyanpay',
                eventId,
              },
            },
          });

    if (!webhookEvent) {
      webhookEvent = await this.prisma.paymentWebhookEvent.create({
        data: {
          provider: 'myanmyanpay',
          eventId,
          signatureValid,
          payload: payload as Prisma.InputJsonValue,
        },
      });
    }

    if (!signatureValid) {
      await this.prisma.paymentWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
          errorMessage: 'Invalid webhook signature',
        },
      });
      return { accepted: true };
    }

    const orderIdRaw = payload.orderId ?? payload.order_id ?? payload.provider_order_id ?? null;
    const orderId = typeof orderIdRaw === 'string' ? orderIdRaw.trim() : null;
    if (!orderId) {
      await this.prisma.paymentWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
          errorMessage: 'Missing order_id',
        },
      });
      return { accepted: true };
    }

    const providerTxnIdRaw =
      payload.transactionRefId ?? payload.transaction_ref_id ?? null;
    const providerTxnId =
      typeof providerTxnIdRaw === 'string' ? providerTxnIdRaw.trim() : null;
    const txn = await this.prisma.paymentTransaction.findUnique({
      where: { providerOrderId: orderId },
      include: { payment: true },
    });
    if (!txn) {
      await this.prisma.paymentWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
          errorMessage: 'Transaction not found',
        },
      });
      return { accepted: true };
    }

    const status = this.resolveTransactionStatus(payload);
    const isPaid = status === 'paid';
    const isFailure = ['failed', 'expired'].includes(status);
    const paidAt = isPaid ? new Date() : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: txn.id },
        data: {
          ...(providerTxnId ? { providerTxnId } : {}),
          status,
          paidAt,
          rawWebhookPayload: payload as Prisma.InputJsonValue,
        },
      });

      if (isPaid && txn.payment.status !== 'paid') {
        await tx.payment.update({
          where: { id: txn.paymentId },
          data: {
            status: 'paid',
            paidAt,
            paymentMethod: 'myanmyanpay',
            providerRef: providerTxnId ?? txn.providerOrderId,
          },
        });
        await this.syncSubscriptionStatusFromInvoices(tx, txn.payment.subscriptionId);
      } else if (isFailure && txn.payment.status !== 'paid') {
        await tx.payment.update({
          where: { id: txn.paymentId },
          data: {
            status: 'failed',
            providerRef: providerTxnId ?? txn.payment.providerRef,
          },
        });
        await this.syncSubscriptionStatusFromInvoices(tx, txn.payment.subscriptionId);
      }

      await tx.paymentWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
          errorMessage: null,
        },
      });
    });

    return { accepted: true };
  }

  private normalizePayload(
    body: Record<string, unknown>,
    rawBody: string,
  ): Record<string, unknown> {
    if (typeof body.payloadString === 'string') {
      try {
        return JSON.parse(body.payloadString) as Record<string, unknown>;
      } catch {
        return body;
      }
    }

    try {
      const parsed = JSON.parse(rawBody) as Record<string, unknown>;
      return typeof parsed === 'object' && parsed !== null ? parsed : body;
    } catch {
      return body;
    }
  }

  private resolveEventId(
    payload: Record<string, unknown>,
    input: { rawBody: string; nonce?: string },
  ) {
    const explicit =
      this.readString(payload.eventId) ??
      this.readString(payload.event_id) ??
      this.readString(payload.id) ??
      this.readString(payload.transactionRefId) ??
      this.readString(payload.transaction_ref_id);
    if (explicit) {
      return explicit;
    }

    const orderId =
      this.readString(payload.orderId) ??
      this.readString(payload.order_id) ??
      'unknown-order';
    const status = this.readString(payload.status) ?? 'unknown-status';
    const digest = createHash('sha256').update(input.rawBody).digest('hex').slice(0, 16);
    const nonce = input.nonce?.trim() || 'no-nonce';
    return `${orderId}:${status}:${nonce}:${digest}`;
  }

  private resolveTransactionStatus(payload: Record<string, unknown>) {
    const condition = (this.readString(payload.condition) ?? '').toUpperCase();
    if (condition === 'EXPIRED') {
      return 'expired';
    }

    switch ((this.readString(payload.status) ?? '').toUpperCase()) {
      case 'SUCCESS':
      case 'PAID':
      case 'SUCCEEDED':
        return 'paid';
      case 'FAILED':
        return 'failed';
      case 'REFUNDED':
        return 'refunded';
      default:
        return 'pending';
    }
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : null;
  }

  private async syncSubscriptionStatusFromInvoices(
    tx: Prisma.TransactionClient,
    subscriptionId: string,
  ) {
    const subscription = await (tx as any).subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        payments: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!subscription) {
      return;
    }

    if (['cancelled', 'expired', 'inactive'].includes(subscription.status)) {
      return;
    }

    const hasOverdueInvoice = subscription.payments.some(
      (payment: { status: string }) => payment.status === 'overdue',
    );
    const isExpiredTrial =
      subscription.plan.billingPeriod === 'trial' &&
      subscription.endAt &&
      subscription.endAt.getTime() <= Date.now();
    const nextStatus = hasOverdueInvoice
      ? 'overdue'
      : isExpiredTrial
        ? 'expired'
        : subscription.plan.billingPeriod === 'trial'
          ? 'trialing'
          : 'active';

    if (
      platformSubscriptionStatuses.includes(
        nextStatus as (typeof platformSubscriptionStatuses)[number],
      ) &&
      subscription.status !== nextStatus
    ) {
      await (tx as any).subscription.update({
        where: { id: subscriptionId },
        data: {
          status: nextStatus,
        },
      });
    }
  }
}
