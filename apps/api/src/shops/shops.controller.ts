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
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import type { AuthenticatedUser } from '../common/http/request-context';
import { ShopsService } from './shops.service';

@Controller('api/v1/shops')
@UseGuards(AuthGuard)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Post()
  createShop(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(this.shopsService.createShop(currentUser, body));
  }

  @Get(':shopId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.shopsRead)
  getShop(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
  ) {
    return ok(this.shopsService.getShop(currentUser, shopId));
  }

  @Patch(':shopId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.shopsWrite)
  updateShop(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(this.shopsService.updateShop(currentUser, shopId, body));
  }

  @Get(':shopId/members')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersRead)
  listMembers(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.shopsService.listMembers(currentUser, shopId, query);
  }

  @Post(':shopId/members')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersManage)
  addMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(this.shopsService.addMember(currentUser, shopId, body));
  }

  @Patch(':shopId/members/:memberId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersManage)
  updateMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('memberId') memberId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(
      this.shopsService.updateMember(currentUser, shopId, memberId, body),
    );
  }
}
