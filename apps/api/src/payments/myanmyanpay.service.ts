import { Injectable } from '@nestjs/common';

type CreateMmqrSessionInput = {
  invoiceNo: string;
  amount: number;
  currency: string;
  orderId: string;
  expiresInSeconds: number;
};

@Injectable()
export class MyanmyanpayService {
  async createMmqrSession(input: CreateMmqrSessionInput) {
    // Phase-1 scaffold: deterministic mock payload, no external provider call yet.
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    const qrPayload = [
      'MMQR',
      `invoice=${encodeURIComponent(input.invoiceNo)}`,
      `amount=${input.amount}`,
      `currency=${encodeURIComponent(input.currency)}`,
      `order_id=${encodeURIComponent(input.orderId)}`,
      `exp=${expiresAt.toISOString()}`,
    ].join('|');

    return {
      provider_order_id: input.orderId,
      provider_txn_id: null as string | null,
      status: 'pending' as const,
      qr_payload: qrPayload,
      qr_image_url: null as string | null,
      expires_at: expiresAt,
      raw_response: {
        mode: 'mock',
        provider: 'myanmyanpay',
        provider_order_id: input.orderId,
      } as Record<string, unknown>,
    };
  }
}
