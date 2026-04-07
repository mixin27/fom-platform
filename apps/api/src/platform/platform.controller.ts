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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import type { AuthenticatedUser } from '../common/http/request-context';
import { CreatePlatformShopDto } from './dto/create-platform-shop.dto';
import { ListPlatformShopsQueryDto } from './dto/list-platform-shops-query.dto';
import { ListPlatformSubscriptionsQueryDto } from './dto/list-platform-subscriptions-query.dto';
import { UpdatePlatformShopDto } from './dto/update-platform-shop.dto';
import { PlatformService } from './platform.service';

@Controller('api/v1/platform')
@UseGuards(AuthGuard)
@ApiTags('Platform')
@ApiBearerAuth('access-token')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('dashboard')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformDashboardRead)
  @ApiOperation({ summary: 'Get platform dashboard metrics' })
  getDashboard() {
    return ok(this.platformService.getDashboard());
  }

  @Get('shops')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({ summary: 'List shops for the platform workspace' })
  listShops(@Query() query: ListPlatformShopsQueryDto) {
    return this.platformService.listShops(query);
  }

  @Get('shops/:shopId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsRead)
  @ApiOperation({ summary: 'Get a single shop from the platform workspace' })
  getShop(@Param('shopId') shopId: string) {
    return ok(this.platformService.getShop(shopId));
  }

  @Post('shops')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsWrite)
  @ApiOperation({ summary: 'Create a shop from the platform workspace' })
  createShop(@Body() body: CreatePlatformShopDto) {
    return ok(this.platformService.createShop(body));
  }

  @Patch('shops/:shopId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsWrite)
  @ApiOperation({ summary: 'Update a shop from the platform workspace' })
  updateShop(
    @Param('shopId') shopId: string,
    @Body() body: UpdatePlatformShopDto,
  ) {
    return ok(this.platformService.updateShop(shopId, body));
  }

  @Delete('shops/:shopId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformShopsWrite)
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a shop and all shop-scoped data' })
  async deleteShop(@Param('shopId') shopId: string) {
    await this.platformService.deleteShop(shopId);
  }

  @Get('subscriptions')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSubscriptionsRead)
  @ApiOperation({ summary: 'Get subscription, invoice, and renewal data' })
  getSubscriptions(@Query() query: ListPlatformSubscriptionsQueryDto) {
    return ok(this.platformService.getSubscriptions(query));
  }

  @Get('support')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSupportRead)
  @ApiOperation({ summary: 'Get platform support and operator queue data' })
  getSupport() {
    return ok(this.platformService.getSupport());
  }

  @Get('settings')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.platformSettingsWrite)
  @ApiOperation({ summary: 'Get platform admin settings data' })
  getSettings(@CurrentUser() currentUser: AuthenticatedUser) {
    return ok(this.platformService.getSettings(currentUser));
  }
}
