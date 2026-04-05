import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
import { CustomersService } from './customers.service';

@Controller('api/v1/shops/:shopId/customers')
@UseGuards(AuthGuard, RbacGuard)
@ApiTags('Customers')
@ApiBearerAuth('access-token')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions(permissions.customersRead)
  listCustomers(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.customersService.listCustomers(currentUser, shopId, query);
  }

  @Post()
  @RequirePermissions(permissions.customersWrite)
  createCustomer(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(this.customersService.createCustomer(currentUser, shopId, body));
  }

  @Get(':customerId')
  @RequirePermissions(permissions.customersRead)
  getCustomer(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('customerId') customerId: string,
  ) {
    return ok(
      this.customersService.getCustomer(currentUser, shopId, customerId),
    );
  }

  @Patch(':customerId')
  @RequirePermissions(permissions.customersWrite)
  updateCustomer(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('customerId') customerId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return ok(
      this.customersService.updateCustomer(
        currentUser,
        shopId,
        customerId,
        body,
      ),
    );
  }
}
