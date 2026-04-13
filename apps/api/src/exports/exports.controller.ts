import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/http/current-user.decorator';
import { AuthGuard } from '../common/http/auth.guard';
import { RequirePlanFeatures } from '../common/http/plan-features.decorator';
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import { SubscriptionFeatureGuard } from '../common/http/subscription-feature.guard';
import type { AuthenticatedUser } from '../common/http/request-context';
import { subscriptionFeatures } from '../platform/subscription-feature.constants';
import { ExportsService } from './exports.service';

type CsvReply = {
  header(name: string, value: string): CsvReply;
  send(payload: string): unknown;
};

@Controller('api/v1/shops/:shopId/exports')
@UseGuards(AuthGuard, RbacGuard, SubscriptionFeatureGuard)
@RequirePlanFeatures(subscriptionFeatures.csvExports)
@ApiTags('Shop Exports')
@ApiBearerAuth('access-token')
export class ShopExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('orders.csv')
  @RequirePermissions(permissions.ordersRead)
  @ApiOperation({ summary: 'Export shop orders as CSV' })
  @ApiProduces('text/csv')
  async exportOrders(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Res() reply: CsvReply,
  ) {
    return this.sendCsv(
      reply,
      await this.exportsService.exportShopOrdersCsv(currentUser.id, shopId),
    );
  }

  @Get('customers.csv')
  @RequirePermissions(permissions.customersRead)
  @ApiOperation({ summary: 'Export shop customers as CSV' })
  @ApiProduces('text/csv')
  async exportCustomers(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Res() reply: CsvReply,
  ) {
    return this.sendCsv(
      reply,
      await this.exportsService.exportShopCustomersCsv(currentUser.id, shopId),
    );
  }

  @Get('deliveries.csv')
  @RequirePermissions(permissions.deliveriesRead)
  @ApiOperation({ summary: 'Export shop deliveries as CSV' })
  @ApiProduces('text/csv')
  async exportDeliveries(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Res() reply: CsvReply,
  ) {
    return this.sendCsv(
      reply,
      await this.exportsService.exportShopDeliveriesCsv(currentUser.id, shopId),
    );
  }

  @Get('members.csv')
  @RequirePermissions(permissions.membersRead)
  @RequirePlanFeatures(subscriptionFeatures.teamMembers)
  @ApiOperation({ summary: 'Export shop members as CSV' })
  @ApiProduces('text/csv')
  async exportMembers(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Res() reply: CsvReply,
  ) {
    return this.sendCsv(
      reply,
      await this.exportsService.exportShopMembersCsv(currentUser.id, shopId),
    );
  }

  private sendCsv(
    reply: CsvReply,
    file: { filename: string; content: string },
  ) {
    reply.header('content-type', 'text/csv; charset=utf-8');
    reply.header(
      'content-disposition',
      `attachment; filename="${file.filename}"`,
    );
    return reply.send(file.content);
  }
}

@Controller('api/v1/platform/exports')
@UseGuards(AuthGuard, RbacGuard)
@ApiTags('Platform Exports')
@ApiBearerAuth('access-token')
export class PlatformExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('shops.csv')
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({ summary: 'Export platform shops as CSV' })
  @ApiProduces('text/csv')
  async exportShops(@Res() reply: CsvReply) {
    return this.sendCsv(reply, await this.exportsService.exportPlatformShopsCsv());
  }

  @Get('users.csv')
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({ summary: 'Export platform users as CSV' })
  @ApiProduces('text/csv')
  async exportUsers(@Res() reply: CsvReply) {
    return this.sendCsv(reply, await this.exportsService.exportPlatformUsersCsv());
  }

  @Get('subscriptions.csv')
  @RequirePermissions(permissions.platformSubscriptionsRead)
  @ApiOperation({ summary: 'Export subscriptions as CSV' })
  @ApiProduces('text/csv')
  async exportSubscriptions(@Res() reply: CsvReply) {
    return this.sendCsv(
      reply,
      await this.exportsService.exportPlatformSubscriptionsCsv(),
    );
  }

  @Get('invoices.csv')
  @RequirePermissions(permissions.platformSubscriptionsRead)
  @ApiOperation({ summary: 'Export invoices as CSV' })
  @ApiProduces('text/csv')
  async exportInvoices(@Res() reply: CsvReply) {
    return this.sendCsv(
      reply,
      await this.exportsService.exportPlatformInvoicesCsv(),
    );
  }

  private sendCsv(
    reply: CsvReply,
    file: { filename: string; content: string },
  ) {
    reply.header('content-type', 'text/csv; charset=utf-8');
    reply.header(
      'content-disposition',
      `attachment; filename="${file.filename}"`,
    );
    return reply.send(file.content);
  }
}
