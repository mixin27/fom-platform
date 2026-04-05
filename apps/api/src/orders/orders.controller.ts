import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import type { AuthenticatedUser } from '../common/http/request-context';
import { OrdersService } from './orders.service';

@Controller('api/v1/shops/:shopId/orders')
@UseGuards(AuthGuard, RbacGuard)
@ApiTags('Orders')
@ApiBearerAuth('access-token')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions(permissions.ordersRead)
  listOrders(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.ordersService.listOrders(currentUser, shopId, query);
  }

  @Post()
  @RequirePermissions(permissions.ordersWrite)
  createOrder(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(this.ordersService.createOrder(currentUser, shopId, body));
  }

  @Get(':orderId')
  @RequirePermissions(permissions.ordersRead)
  getOrder(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
  ) {
    return ok(this.ordersService.getOrder(currentUser, shopId, orderId));
  }

  @Patch(':orderId')
  @RequirePermissions(permissions.ordersWrite)
  updateOrder(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(
      this.ordersService.updateOrder(currentUser, shopId, orderId, body),
    );
  }

  @Post(':orderId/status')
  @RequirePermissions(permissions.orderStatusWrite)
  updateStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(
      this.ordersService.changeStatus(currentUser, shopId, orderId, body),
    );
  }

  @Post(':orderId/items')
  @RequirePermissions(permissions.orderItemsWrite)
  addItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(this.ordersService.addItem(currentUser, shopId, orderId, body));
  }

  @Patch(':orderId/items/:itemId')
  @RequirePermissions(permissions.orderItemsWrite)
  updateItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(
      this.ordersService.updateItem(currentUser, shopId, orderId, itemId, body),
    );
  }

  @Delete(':orderId/items/:itemId')
  @RequirePermissions(permissions.orderItemsWrite)
  @HttpCode(204)
  removeItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
  ) {
    this.ordersService.removeItem(currentUser, shopId, orderId, itemId);
  }
}
