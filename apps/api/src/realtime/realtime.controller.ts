import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import type { AuthenticatedUser } from '../common/http/request-context';
import { CreateRealtimeTicketQueryDto } from './dto/create-realtime-ticket-query.dto';
import { RealtimeService } from './realtime.service';

@Controller('api/v1/realtime')
@UseGuards(AuthGuard)
@ApiTags('Realtime')
@ApiBearerAuth('access-token')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Issue a short-lived websocket ticket' })
  createTicket(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: CreateRealtimeTicketQueryDto,
  ) {
    return ok(this.realtimeService.issueTicket(currentUser, query));
  }
}
