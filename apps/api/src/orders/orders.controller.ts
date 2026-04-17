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
  Query,
  Res,
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
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ImportOrdersSpreadsheetDto } from './dto/import-orders-spreadsheet.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { ParseOrderMessageDto } from './dto/parse-order-message.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrdersService } from './orders.service';

type BinaryReply = {
  header(name: string, value: string): BinaryReply;
  send(payload: Buffer): unknown;
};

@Controller('api/v1/shops/:shopId/orders')
@UseGuards(AuthGuard, RbacGuard, SubscriptionFeatureGuard)
@ApiTags('Orders')
@ApiBearerAuth('access-token')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions(permissions.ordersRead)
  @RequirePlanFeatures(subscriptionFeatures.ordersManagement)
  @ApiOperation({ summary: 'List orders for a shop with filters' })
  listOrders(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: ListOrdersQueryDto,
  ) {
    return this.ordersService.listOrders(currentUser, shopId, query);
  }

  @Post()
  @RequirePermissions(permissions.ordersWrite)
  @ApiOperation({ summary: 'Create an order' })
  createOrder(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: CreateOrderDto,
  ) {
    return ok(this.ordersService.createOrder(currentUser, shopId, body));
  }

  @Get('import-template.xlsx')
  @RequirePermissions(permissions.ordersWrite)
  @RequirePlanFeatures(subscriptionFeatures.ordersImportSpreadsheet)
  @ApiOperation({ summary: 'Download the spreadsheet template for order import' })
  async downloadImportTemplate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Res() reply: BinaryReply,
  ) {
    const file = await this.ordersService.downloadImportTemplate(
      currentUser,
      shopId,
    );

    reply.header(
      'content-type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    reply.header(
      'content-disposition',
      `attachment; filename="${file.filename}"`,
    );
    return reply.send(file.content);
  }

  @Post('import-spreadsheet')
  @RequirePermissions(permissions.ordersWrite)
  @RequirePlanFeatures(subscriptionFeatures.ordersImportSpreadsheet)
  @ApiOperation({ summary: 'Import orders from an Excel-compatible spreadsheet' })
  importSpreadsheet(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: ImportOrdersSpreadsheetDto,
  ) {
    return ok(
      this.ordersService.importOrdersFromSpreadsheet(currentUser, shopId, body),
    );
  }

  @Post('parse-message')
  @RequirePermissions(permissions.ordersWrite)
  @RequirePlanFeatures(subscriptionFeatures.ordersParseMessenger)
  @ApiOperation({
    summary: 'Parse copied Messenger text into a suggested order draft',
  })
  parseOrderMessage(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: ParseOrderMessageDto,
  ) {
    return ok(this.ordersService.parseOrderMessage(currentUser, shopId, body));
  }

  @Get(':orderId')
  @RequirePermissions(permissions.ordersRead)
  @ApiOperation({ summary: 'Get order details and status history' })
  getOrder(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
  ) {
    return ok(this.ordersService.getOrder(currentUser, shopId, orderId));
  }

  @Patch(':orderId')
  @RequirePermissions(permissions.ordersWrite)
  @ApiOperation({ summary: 'Update order metadata' })
  updateOrder(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Body() body: UpdateOrderDto,
  ) {
    return ok(
      this.ordersService.updateOrder(currentUser, shopId, orderId, body),
    );
  }

  @Post(':orderId/status')
  @RequirePermissions(permissions.orderStatusWrite)
  @HttpCode(200)
  @ApiOperation({ summary: 'Change order status' })
  updateStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Body() body: ChangeOrderStatusDto,
  ) {
    return ok(
      this.ordersService.changeStatus(currentUser, shopId, orderId, body),
    );
  }

  @Post(':orderId/items')
  @RequirePermissions(permissions.orderItemsWrite)
  @ApiOperation({ summary: 'Add an item to an order' })
  addItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Body() body: AddOrderItemDto,
  ) {
    return ok(this.ordersService.addItem(currentUser, shopId, orderId, body));
  }

  @Patch(':orderId/items/:itemId')
  @RequirePermissions(permissions.orderItemsWrite)
  @ApiOperation({ summary: 'Update an order item' })
  updateItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateOrderItemDto,
  ) {
    return ok(
      this.ordersService.updateItem(currentUser, shopId, orderId, itemId, body),
    );
  }

  @Delete(':orderId/items/:itemId')
  @RequirePermissions(permissions.orderItemsWrite)
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove an item from an order' })
  async removeItem(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
  ) {
    await this.ordersService.removeItem(currentUser, shopId, orderId, itemId);
  }
}
