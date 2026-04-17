import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async handleMyanmyanpayWebhook(payload: Record<string, unknown>, signature?: string) {
    const expected = process.env.MYANMYANPAY_WEBHOOK_SECRET?.trim();
    const signatureValid = !expected || expected === signature;
    const eventIdRaw = payload.event_id ?? payload.id ?? null;
    const eventId = typeof eventIdRaw === 'string' ? eventIdRaw.trim() : null;

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

    const orderIdRaw = payload.order_id ?? payload.provider_order_id ?? null;
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

    const statusRaw = payload.status ?? payload.payment_status ?? 'pending';
    const status = typeof statusRaw === 'string' ? statusRaw.toLowerCase() : 'pending';
    const isPaid = ['paid', 'success', 'succeeded'].includes(status);
    const paidAt = isPaid ? new Date() : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: txn.id },
        data: {
          status: isPaid ? 'paid' : status,
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
            providerRef: txn.providerOrderId,
          },
        });
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
}
