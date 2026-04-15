import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import type { AuthenticatedUser } from '../common/http/request-context';
import { EnterpriseService } from './enterprise.service';
import { ListEnterpriseWorkspaceQueryDto } from './dto/list-enterprise-workspace-query.dto';

@Controller('api/v1/enterprise')
@UseGuards(AuthGuard)
@ApiTags('Enterprise')
@ApiBearerAuth('access-token')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Get('workspace')
  @ApiOperation({
    summary: 'Get cross-shop workspace metrics and filters for the current operator',
  })
  getWorkspace(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListEnterpriseWorkspaceQueryDto,
  ) {
    return ok(this.enterpriseService.getWorkspace(currentUser, query));
  }
}
