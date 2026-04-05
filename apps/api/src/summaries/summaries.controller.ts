import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import type { AuthenticatedUser } from '../common/http/request-context';
import { GetDailySummaryQueryDto } from './dto/get-daily-summary-query.dto';
import { SummariesService } from './summaries.service';

@Controller('api/v1/shops/:shopId/summaries')
@UseGuards(AuthGuard, RbacGuard)
@ApiTags('Summaries')
@ApiBearerAuth('access-token')
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Get('daily')
  @RequirePermissions(permissions.summariesRead)
  @ApiOperation({ summary: 'Get the daily summary for a shop' })
  getDailySummary(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: GetDailySummaryQueryDto,
  ) {
    return ok(
      this.summariesService.getDailySummary(currentUser, shopId, query),
    );
  }
}
