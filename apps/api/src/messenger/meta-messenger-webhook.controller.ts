import { Body, Controller, Get, Headers, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithContext } from '../common/http/request-context';
import { MessengerService } from './messenger.service';

type RawReply = {
  code(statusCode: number): RawReply;
  header(name: string, value: string): RawReply;
  send(payload: string): unknown;
};

@Controller('api/v1/messenger/webhooks/meta')
@ApiTags('Messenger')
export class MetaMessengerWebhookController {
  constructor(private readonly messengerService: MessengerService) {}

  @Get()
  @ApiOperation({ summary: 'Meta Messenger webhook verification endpoint' })
  verifyWebhook(
    @Query() query: Record<string, string | undefined>,
    @Res() reply: RawReply,
  ) {
    const challenge = this.messengerService.resolveWebhookChallenge({
      'hub.mode': query['hub.mode'],
      'hub.verify_token': query['hub.verify_token'],
      'hub.challenge': query['hub.challenge'],
    });

    reply.header('content-type', 'text/plain');
    return reply.send(challenge);
  }

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Meta Messenger webhook receiver' })
  async receiveWebhook(
    @Req() request: RequestWithContext,
    @Body() body: Record<string, unknown>,
    @Headers() headers?: Record<string, string | string[] | undefined>,
    @Res() reply?: RawReply,
  ) {
    const rawBody =
      typeof request.rawBody === 'string'
        ? request.rawBody
        : request.rawBody instanceof Buffer
          ? request.rawBody.toString('utf8')
          : JSON.stringify(body);

    await this.messengerService.handleWebhookEvent({
      body,
      rawBody,
      signature: this.readHeader(headers, 'x-hub-signature-256'),
    });

    reply?.header('content-type', 'text/plain');
    return reply?.send('EVENT_RECEIVED');
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
