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
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { ListDeliveriesQueryDto } from './dto/list-deliveries-query.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { DeliveriesService } from './deliveries.service';

@Controller('api/v1/shops/:shopId/deliveries')
@UseGuards(AuthGuard, RbacGuard, SubscriptionFeatureGuard)
@ApiTags('Deliveries')
@ApiBearerAuth('access-token')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  @RequirePermissions(permissions.deliveriesRead)
  @RequirePlanFeatures(subscriptionFeatures.deliveriesManagement)
  @ApiOperation({ summary: 'List deliveries for a shop' })
  listDeliveries(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: ListDeliveriesQueryDto,
  ) {
    return this.deliveriesService.listDeliveries(currentUser, shopId, query);
  }

  @Post()
  @RequirePermissions(permissions.deliveriesWrite)
  @ApiOperation({ summary: 'Create a delivery assignment for an order' })
  createDelivery(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: CreateDeliveryDto,
  ) {
    return ok(this.deliveriesService.createDelivery(currentUser, shopId, body));
  }

  @Patch(':deliveryId')
  @RequirePermissions(permissions.deliveriesWrite)
  @ApiOperation({ summary: 'Update delivery status or assignment details' })
  updateDelivery(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('deliveryId') deliveryId: string,
    @Body() body: UpdateDeliveryDto,
  ) {
    return ok(
      this.deliveriesService.updateDelivery(
        currentUser,
        shopId,
        deliveryId,
        body,
      ),
    );
  }
}
