import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import { RequirePermissions } from '../common/http/permissions.decorator';
import { permissions } from '../common/http/rbac.constants';
import { RbacGuard } from '../common/http/rbac.guard';
import type { AuthenticatedUser } from '../common/http/request-context';
import { GetMonthlyReportQueryDto } from './dto/get-monthly-report-query.dto';
import { GetWeeklyReportQueryDto } from './dto/get-weekly-report-query.dto';
import { SummariesService } from './summaries.service';

@Controller('api/v1/shops/:shopId/reports')
@UseGuards(AuthGuard, RbacGuard)
@ApiTags('Reports')
@ApiBearerAuth('access-token')
export class ReportsController {
  constructor(private readonly summariesService: SummariesService) {}

  @Get('weekly')
  @RequirePermissions(permissions.summariesRead)
  @ApiOperation({ summary: 'Get the weekly report for a shop' })
  getWeeklyReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: GetWeeklyReportQueryDto,
  ) {
    return ok(
      this.summariesService.getWeeklyReport(currentUser, shopId, query),
    );
  }

  @Get('monthly')
  @RequirePermissions(permissions.summariesRead)
  @ApiOperation({ summary: 'Get the monthly report for a shop' })
  getMonthlyReport(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('shopId') shopId: string,
    @Query() query: GetMonthlyReportQueryDto,
  ) {
    return ok(
      this.summariesService.getMonthlyReport(currentUser, shopId, query),
    );
  }
}
