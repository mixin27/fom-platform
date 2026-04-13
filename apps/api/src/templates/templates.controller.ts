import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import { RequirePlanFeatures } from '../common/http/plan-features.decorator';
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import { SubscriptionFeatureGuard } from '../common/http/subscription-feature.guard';
import type { AuthenticatedUser } from '../common/http/request-context';
import { subscriptionFeatures } from '../platform/subscription-feature.constants';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { ListMessageTemplatesQueryDto } from './dto/list-message-templates-query.dto';
import { UpdateMessageTemplateDto } from './dto/update-message-template.dto';
import { TemplatesService } from './templates.service';

@Controller('api/v1/shops/:shopId/templates')
@UseGuards(AuthGuard, RbacGuard, SubscriptionFeatureGuard)
@RequirePlanFeatures(subscriptionFeatures.templatesManagement)
@ApiTags('Message Templates')
@ApiBearerAuth('access-token')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @RequirePermissions(permissions.templatesRead)
  @ApiOperation({ summary: 'List message templates for a shop' })
  listTemplates(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: ListMessageTemplatesQueryDto,
  ) {
    return this.templatesService.listTemplates(currentUser, shopId, query);
  }

  @Post()
  @RequirePermissions(permissions.templatesWrite)
  @ApiOperation({ summary: 'Create a message template' })
  createTemplate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: CreateMessageTemplateDto,
  ) {
    return ok(this.templatesService.createTemplate(currentUser, shopId, body));
  }

  @Patch(':templateId')
  @RequirePermissions(permissions.templatesWrite)
  @ApiOperation({ summary: 'Update a message template' })
  updateTemplate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('templateId') templateId: string,
    @Body() body: UpdateMessageTemplateDto,
  ) {
    return ok(
      this.templatesService.updateTemplate(
        currentUser,
        shopId,
        templateId,
        body,
      ),
    );
  }
}
