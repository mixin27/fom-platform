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
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@Controller('api/v1/shops/:shopId/customers')
@UseGuards(AuthGuard, RbacGuard, SubscriptionFeatureGuard)
@RequirePlanFeatures(subscriptionFeatures.customersManagement)
@ApiTags('Customers')
@ApiBearerAuth('access-token')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions(permissions.customersRead)
  @ApiOperation({ summary: 'List customers for a shop' })
  listCustomers(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: ListCustomersQueryDto,
  ) {
    return this.customersService.listCustomers(currentUser, shopId, query);
  }

  @Post()
  @RequirePermissions(permissions.customersWrite)
  @ApiOperation({
    summary: 'Create a customer or merge with an existing phone match',
  })
  createCustomer(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Body() body: CreateCustomerDto,
  ) {
    return ok(this.customersService.createCustomer(currentUser, shopId, body));
  }

  @Get(':customerId')
  @RequirePermissions(permissions.customersRead)
  @ApiOperation({ summary: 'Get customer details and recent order history' })
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
  @ApiOperation({ summary: 'Update customer profile details' })
  updateCustomer(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Param('customerId') customerId: string,
    @Body() body: UpdateCustomerDto,
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
