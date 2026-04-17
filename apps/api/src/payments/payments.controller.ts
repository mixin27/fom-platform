import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/http/api-result';
import { PaymentsService } from './payments.service';

@Controller('api/v1/payments')
@ApiTags('Payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhooks/myanmyanpay')
  @HttpCode(200)
  @ApiOperation({ summary: 'MyanMyanPay webhook receiver' })
  async handleMyanmyanpayWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-myanmyanpay-signature') signature?: string,
  ) {
    return ok(
      await this.paymentsService.handleMyanmyanpayWebhook(body, signature),
    );
  }
}
