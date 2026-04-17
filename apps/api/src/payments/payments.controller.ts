import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/http/api-result';
import type { RequestWithContext } from '../common/http/request-context';
import { PaymentsService } from './payments.service';

@Controller('api/v1/payments')
@ApiTags('Payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhooks/myanmyanpay')
  @HttpCode(200)
  @ApiOperation({ summary: 'MyanMyanPay webhook receiver' })
  async handleMyanmyanpayWebhook(
    @Req() request: RequestWithContext,
    @Body() body: Record<string, unknown>,
    @Headers() headers?: Record<string, string | string[] | undefined>,
  ) {
    const rawBody =
      typeof request.rawBody === 'string'
        ? request.rawBody
        : request.rawBody instanceof Buffer
          ? request.rawBody.toString('utf8')
          : typeof body.payloadString === 'string'
            ? body.payloadString
            : JSON.stringify(body);

    const signature =
      this.readHeader(headers, 'x-mmpay-signature') ??
      this.readHeader(headers, 'x-myanmyanpay-signature') ??
      this.readHeader(headers, 'sppay-x-signature');
    const nonce =
      this.readHeader(headers, 'x-mmpay-nonce') ??
      this.readHeader(headers, 'x-myanmyanpay-nonce') ??
      this.readHeader(headers, 'sppay-x-nonce');

    return ok(
      await this.paymentsService.handleMyanmyanpayWebhook({
        body,
        rawBody,
        signature,
        nonce,
      }),
    );
  }

  private readHeader(
    headers: Record<string, string | string[] | undefined> | undefined,
    key: string,
  ) {
    const value = headers?.[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return typeof value === 'string' ? value : undefined;
  }
}
