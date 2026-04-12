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
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import type { AuthenticatedUser } from '../common/http/request-context';
import { AddShopMemberDto } from './dto/add-shop-member.dto';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopMemberDto } from './dto/update-shop-member.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';

@Controller('api/v1/shops')
@UseGuards(AuthGuard)
@ApiTags('Shops')
@ApiBearerAuth('access-token')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user shops or stores' })
  listShops(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.shopsService.listShops(currentUser, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new shop or store' })
  createShop(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: CreateShopDto,
  ) {
    return ok(this.shopsService.createShop(currentUser, body));
  }

  @Get(':shopId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.shopsRead)
  @ApiOperation({ summary: 'Get shop details' })
  getShop(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
  ) {
    return ok(this.shopsService.getShop(currentUser, shopId));
  }

  @Patch(':shopId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.shopsWrite)
  @ApiOperation({ summary: 'Update shop settings' })
  updateShop(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: UpdateShopDto,
  ) {
    return ok(this.shopsService.updateShop(currentUser, shopId, body));
  }

  @Get(':shopId/billing')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.shopsWrite)
  @ApiOperation({ summary: 'Get shop subscription and recent billing history' })
  getBilling(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
  ) {
    return ok(this.shopsService.getBilling(currentUser, shopId));
  }

  @Get(':shopId/members')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersRead)
  @ApiOperation({ summary: 'List shop members' })
  listMembers(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.shopsService.listMembers(currentUser, shopId, query);
  }

  @Post(':shopId/members')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersManage)
  @ApiOperation({ summary: 'Add or invite a shop member' })
  addMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: AddShopMemberDto,
  ) {
    return ok(this.shopsService.addMember(currentUser, shopId, body));
  }

  @Patch(':shopId/members/:memberId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersManage)
  @ApiOperation({ summary: 'Update shop member status or roles' })
  updateMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateShopMemberDto,
  ) {
    return ok(
      this.shopsService.updateMember(currentUser, shopId, memberId, body),
    );
  }
}
