import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { RequirePlanFeatures } from '../common/http/plan-features.decorator';
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import { SubscriptionFeatureGuard } from '../common/http/subscription-feature.guard';
import { subscriptionFeatures } from '../platform/subscription-feature.constants';
import { CreateMessengerAutoReplyRuleDto } from './dto/create-messenger-auto-reply-rule.dto';
import { ListMessengerThreadsQueryDto } from './dto/list-messenger-threads-query.dto';
import { SendMessengerReplyDto } from './dto/send-messenger-reply.dto';
import { UpdateMessengerConnectionDto } from './dto/update-messenger-connection.dto';
import { UpdateMessengerAutoReplyRuleDto } from './dto/update-messenger-auto-reply-rule.dto';
import { MessengerService } from './messenger.service';

@Controller('api/v1/shops/:shopId/messenger')
@UseGuards(AuthGuard, RbacGuard, SubscriptionFeatureGuard)
@ApiTags('Messenger')
@ApiBearerAuth('access-token')
export class MessengerController {
  constructor(private readonly messengerService: MessengerService) {}

  @Get()
  @RequirePermissions(permissions.ordersRead)
  @RequirePlanFeatures(subscriptionFeatures.facebookInboxIntegration)
  @ApiOperation({ summary: 'Get Messenger inbox connection status and setup details' })
  getOverview(@Param('shopId') shopId: string) {
    return ok(this.messengerService.getOverview(shopId));
  }

  @Put('connection')
  @RequirePermissions(permissions.shopsWrite)
  @RequirePlanFeatures(subscriptionFeatures.facebookInboxIntegration)
  @ApiOperation({ summary: 'Create or update the connected Facebook Page for this shop' })
  updateConnection(
    @Param('shopId') shopId: string,
    @Body() body: UpdateMessengerConnectionDto,
  ) {
    return ok(this.messengerService.updateConnection(shopId, body));
  }

  @Delete('connection')
  @RequirePermissions(permissions.shopsWrite)
  @RequirePlanFeatures(subscriptionFeatures.facebookInboxIntegration)
  @ApiOperation({ summary: 'Disconnect the current Facebook Page token from this shop' })
  @HttpCode(200)
  disconnectConnection(@Param('shopId') shopId: string) {
    return ok(this.messengerService.disconnectConnection(shopId));
  }

  @Get('threads')
  @RequirePermissions(permissions.ordersRead)
  @RequirePlanFeatures(subscriptionFeatures.facebookInboxIntegration)
  @ApiOperation({ summary: 'List Messenger inbox threads for a shop' })
  listThreads(
    @Param('shopId') shopId: string,
    @Query() query: ListMessengerThreadsQueryDto,
  ) {
    return this.messengerService.listThreads(shopId, query);
  }

  @Get('threads/:threadId')
  @RequirePermissions(permissions.ordersRead)
  @RequirePlanFeatures(subscriptionFeatures.facebookInboxIntegration)
  @ApiOperation({ summary: 'Get a Messenger thread with message history' })
  getThread(
    @Param('shopId') shopId: string,
    @Param('threadId') threadId: string,
  ) {
    return ok(this.messengerService.getThread(shopId, threadId));
  }

  @Post('threads/:threadId/read')
  @RequirePermissions(permissions.ordersRead)
  @RequirePlanFeatures(subscriptionFeatures.facebookInboxIntegration)
  @ApiOperation({ summary: 'Mark a Messenger thread as read inside the shop workspace' })
  markThreadRead(
    @Param('shopId') shopId: string,
    @Param('threadId') threadId: string,
  ) {
    return ok(this.messengerService.markThreadRead(shopId, threadId));
  }

  @Post('threads/:threadId/reply')
  @RequirePermissions(permissions.ordersWrite)
  @RequirePlanFeatures(subscriptionFeatures.facebookInboxIntegration)
  @ApiOperation({ summary: 'Send a text reply to a Messenger thread' })
  sendReply(
    @Param('shopId') shopId: string,
    @Param('threadId') threadId: string,
    @Body() body: SendMessengerReplyDto,
  ) {
    return ok(this.messengerService.sendReply(shopId, threadId, body.text));
  }

  @Get('threads/:threadId/order-source')
  @RequirePermissions(permissions.ordersRead)
  @RequirePlanFeatures(subscriptionFeatures.facebookInboxIntegration)
  @ApiOperation({ summary: 'Build a parser-ready text block from inbound Messenger messages' })
  getThreadOrderSource(
    @Param('shopId') shopId: string,
    @Param('threadId') threadId: string,
  ) {
    return ok(this.messengerService.getThreadOrderSource(shopId, threadId));
  }

  @Get('auto-reply-rules')
  @RequirePermissions(permissions.templatesRead)
  @RequirePlanFeatures(
    subscriptionFeatures.facebookInboxIntegration,
    subscriptionFeatures.automationAutoReply,
  )
  @ApiOperation({ summary: 'List Messenger auto reply rules' })
  listAutoReplyRules(@Param('shopId') shopId: string) {
    return ok(this.messengerService.listAutoReplyRules(shopId));
  }

  @Post('auto-reply-rules')
  @RequirePermissions(permissions.templatesWrite)
  @RequirePlanFeatures(
    subscriptionFeatures.facebookInboxIntegration,
    subscriptionFeatures.automationAutoReply,
  )
  @ApiOperation({ summary: 'Create a Messenger auto reply rule' })
  createAutoReplyRule(
    @Param('shopId') shopId: string,
    @Body() body: CreateMessengerAutoReplyRuleDto,
  ) {
    return ok(this.messengerService.createAutoReplyRule(shopId, body));
  }

  @Get('auto-reply-rules/:ruleId')
  @RequirePermissions(permissions.templatesRead)
  @RequirePlanFeatures(
    subscriptionFeatures.facebookInboxIntegration,
    subscriptionFeatures.automationAutoReply,
  )
  @ApiOperation({ summary: 'Get one Messenger auto reply rule' })
  getAutoReplyRule(
    @Param('shopId') shopId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return ok(this.messengerService.getAutoReplyRule(shopId, ruleId));
  }

  @Patch('auto-reply-rules/:ruleId')
  @RequirePermissions(permissions.templatesWrite)
  @RequirePlanFeatures(
    subscriptionFeatures.facebookInboxIntegration,
    subscriptionFeatures.automationAutoReply,
  )
  @ApiOperation({ summary: 'Update a Messenger auto reply rule' })
  updateAutoReplyRule(
    @Param('shopId') shopId: string,
    @Param('ruleId') ruleId: string,
    @Body() body: UpdateMessengerAutoReplyRuleDto,
  ) {
    return ok(this.messengerService.updateAutoReplyRule(shopId, ruleId, body));
  }

  @Delete('auto-reply-rules/:ruleId')
  @RequirePermissions(permissions.templatesWrite)
  @RequirePlanFeatures(
    subscriptionFeatures.facebookInboxIntegration,
    subscriptionFeatures.automationAutoReply,
  )
  @ApiOperation({ summary: 'Delete a Messenger auto reply rule' })
  @HttpCode(204)
  async deleteAutoReplyRule(
    @Param('shopId') shopId: string,
    @Param('ruleId') ruleId: string,
  ) {
    await this.messengerService.deleteAutoReplyRule(shopId, ruleId);
  }
}
