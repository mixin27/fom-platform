import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CursorPaginationQueryDto } from '../common/dto/cursor-pagination-query.dto';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import { getSessionRequestMetadata, type RequestWithContext } from '../common/http/request-context';
import { RequirePlanFeatures } from '../common/http/plan-features.decorator';
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import { SubscriptionFeatureGuard } from '../common/http/subscription-feature.guard';
import type { AuthenticatedUser } from '../common/http/request-context';
import { subscriptionFeatures } from '../platform/subscription-feature.constants';
import { AddShopMemberDto } from './dto/add-shop-member.dto';
import { CreateShopDto } from './dto/create-shop.dto';
import { CreateShopRoleDto } from './dto/create-shop-role.dto';
import { UpdateShopMemberDto } from './dto/update-shop-member.dto';
import { UpdateShopRoleDto } from './dto/update-shop-role.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { CreateShopPaymentProofDto } from './dto/create-shop-payment-proof.dto';
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
  @RequirePermissions(permissions.shopsRead)
  @ApiOperation({ summary: 'Get shop subscription and recent billing history' })
  getBilling(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
  ) {
    return ok(this.shopsService.getBilling(currentUser, shopId));
  }

  @Post(':shopId/billing/payment-proofs')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.shopsRead)
  @ApiOperation({ summary: 'Submit manual payment proof for billing review' })
  submitPaymentProof(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: CreateShopPaymentProofDto,
  ) {
    return ok(this.shopsService.submitPaymentProof(currentUser, shopId, body));
  }

  @Get(':shopId/members')
  @UseGuards(RbacGuard, SubscriptionFeatureGuard)
  @RequirePermissions(permissions.membersRead)
  @RequirePlanFeatures(subscriptionFeatures.teamMembers)
  @ApiOperation({ summary: 'List shop members' })
  listMembers(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.shopsService.listMembers(currentUser, shopId, query);
  }

  @Post(':shopId/members')
  @UseGuards(RbacGuard, SubscriptionFeatureGuard)
  @RequirePermissions(permissions.membersManage)
  @RequirePlanFeatures(subscriptionFeatures.teamMembers)
  @ApiOperation({ summary: 'Add or invite a shop member' })
  addMember(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: AddShopMemberDto,
    @Req() request: RequestWithContext,
  ) {
    return ok(
      this.shopsService.addMember(
        currentUser,
        shopId,
        body,
        getSessionRequestMetadata(request),
      ),
    );
  }

  @Patch(':shopId/members/:memberId')
  @UseGuards(RbacGuard, SubscriptionFeatureGuard)
  @RequirePermissions(permissions.membersManage)
  @RequirePlanFeatures(subscriptionFeatures.teamMembers)
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

  @Post(':shopId/members/:memberId/invite')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersManage)
  @ApiOperation({ summary: 'Resend a pending staff invitation email' })
  resendMemberInvitation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('memberId') memberId: string,
    @Req() request: RequestWithContext,
  ) {
    return ok(
      this.shopsService.resendMemberInvitation(
        currentUser,
        shopId,
        memberId,
        getSessionRequestMetadata(request),
      ),
    );
  }

  @Get(':shopId/roles')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersRead)
  @ApiOperation({ summary: 'List assignable shop roles and permission catalog' })
  listRoles(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
  ) {
    return ok(this.shopsService.listRoles(currentUser, shopId));
  }

  @Post(':shopId/roles')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersManage)
  @ApiOperation({ summary: 'Create a custom shop role' })
  createRole(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: CreateShopRoleDto,
  ) {
    return ok(this.shopsService.createRole(currentUser, shopId, body));
  }

  @Patch(':shopId/roles/:roleId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersManage)
  @ApiOperation({ summary: 'Update a custom shop role' })
  updateRole(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('roleId') roleId: string,
    @Body() body: UpdateShopRoleDto,
  ) {
    return ok(this.shopsService.updateRole(currentUser, shopId, roleId, body));
  }

  @Delete(':shopId/roles/:roleId')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersManage)
  @ApiOperation({ summary: 'Delete a custom shop role' })
  deleteRole(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('roleId') roleId: string,
  ) {
    return ok(this.shopsService.deleteRole(currentUser, shopId, roleId));
  }

  @Get(':shopId/audit-logs')
  @UseGuards(RbacGuard)
  @RequirePermissions(permissions.membersManage)
  @ApiOperation({ summary: 'List recent shop governance audit logs' })
  listAuditLogs(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: CursorPaginationQueryDto,
  ) {
    return this.shopsService.listAuditLogs(currentUser, shopId, query);
  }
}
