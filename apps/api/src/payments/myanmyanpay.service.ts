import { Injectable } from '@nestjs/common';
import { MMPaySDK, type PaymentResponse } from 'mmpay-node-sdk';
import { serviceUnavailableError } from '../common/http/app-http.exception';
import { AppConfigService } from '../config/app-config.service';

type CreateMmqrSessionInput = {
  invoiceNo: string;
  amount: number;
  currency: string;
  orderId: string;
  expiresInSeconds: number;
};

type MyanmyanpaySession = {
  provider_order_id: string;
  provider_txn_id: string | null;
  status: string;
  qr_payload: string | null;
  qr_image_url: string | null;
  payment_url: string | null;
  expires_at: Date;
  raw_response: Record<string, unknown>;
};

@Injectable()
export class MyanmyanpayService {
  private client: ReturnType<typeof MMPaySDK> | null = null;

  constructor(private readonly config: AppConfigService) {}

  isConfigured() {
    return this.config.getMyanmyanpayConfig().isConfigured;
  }

  async createMmqrSession(input: CreateMmqrSessionInput) {
    const client = this.getClient();
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    const payload = {
      orderId: input.orderId,
      amount: input.amount,
      currency: input.currency,
      callbackUrl: this.resolveCallbackUrl(),
      customMessage: `Invoice ${input.invoiceNo}`,
      items: [
        {
          name: `Invoice ${input.invoiceNo}`,
          amount: input.amount,
          quantity: 1,
        },
      ],
    };

    let response: PaymentResponse;
    try {
      response = this.useSandbox()
        ? await client.sandboxPay(payload)
        : await client.pay(payload);
    } catch (error) {
      throw serviceUnavailableError(
        'Unable to start a MyanMyanPay payment session right now.',
        this.buildErrorContext(error),
      );
    }

    return this.normalizeSessionResponse(response, expiresAt);
  }

  async verifyCallback(payload: string, nonce?: string, signature?: string) {
    if (!this.isConfigured()) {
      return false;
    }

    if (!payload || !nonce || !signature) {
      return false;
    }

    try {
      return await this.getClient().verifyCb(payload, nonce, signature);
    } catch {
      return false;
    }
  }

  private getClient() {
    if (this.client) {
      return this.client;
    }

    const { appId, apiBaseUrl, publishableKey, secretKey } =
      this.config.getMyanmyanpayConfig();

    if (!appId || !apiBaseUrl || !publishableKey || !secretKey) {
      throw serviceUnavailableError(
        'MyanMyanPay is not configured yet for this environment.',
      );
    }

    this.client = MMPaySDK({
      appId,
      apiBaseUrl,
      publishableKey,
      secretKey,
    });

    return this.client;
  }

  private useSandbox() {
    return this.config.getMyanmyanpayConfig().useSandbox;
  }

  private resolveCallbackUrl() {
    return this.config.getMyanmyanpayConfig().callbackUrl;
  }

  private normalizeSessionResponse(
    response: PaymentResponse,
    expiresAt: Date,
  ): MyanmyanpaySession {
    if (!response || typeof response.orderId !== 'string') {
      throw serviceUnavailableError(
        'MyanMyanPay returned an invalid payment session response.',
      );
    }

    const qrPayload = this.normalizeNullableString(response.qr);
    const paymentUrl = this.normalizeNullableString(response.url);

    return {
      provider_order_id: response.orderId.trim(),
      provider_txn_id: null,
      status: this.normalizeStatus(response.status),
      qr_payload: qrPayload,
      qr_image_url: this.resolveQrImageUrl(qrPayload),
      payment_url: paymentUrl,
      expires_at: expiresAt,
      raw_response: {
        orderId: response.orderId,
        amount: response.amount,
        currency: response.currency ?? 'MMK',
        status: response.status,
        qr: response.qr,
        url: response.url,
      },
    };
  }

  private resolveQrImageUrl(qrPayload: string | null) {
    if (!qrPayload) {
      return null;
    }

    if (
      qrPayload.startsWith('data:image/') ||
      qrPayload.startsWith('http://') ||
      qrPayload.startsWith('https://')
    ) {
      return qrPayload;
    }

    return qrPayload;

    // return `data:image/png;base64,${qrPayload}`;
  }

  private normalizeStatus(value: string | null | undefined) {
    switch ((value ?? '').trim().toUpperCase()) {
      case 'SUCCESS':
        return 'paid';
      case 'FAILED':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private normalizeNullableString(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private buildErrorContext(error: unknown) {
    if (typeof error !== 'object' || error === null) {
      return undefined;
    }

    const status =
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'status' in error.response &&
      typeof error.response.status === 'number'
        ? error.response.status
        : undefined;
    const data =
      'response' in error &&
      typeof error.response === 'object' &&
      error.response !== null &&
      'data' in error.response
        ? error.response.data
        : undefined;

    return {
      ...(status !== undefined ? { status } : {}),
      ...(data !== undefined ? { data } : {}),
    };
  }
}
