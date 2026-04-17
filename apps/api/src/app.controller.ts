import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements/announcements.service';
import { ListPublicAnnouncementsQueryDto } from './announcements/dto/list-public-announcements-query.dto';
import { ok } from './common/http/api-result';
import { AppService } from './app.service';
import { PlatformService } from './platform/platform.service';

@Controller('api/v1')
@ApiTags('Meta')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly platformService: PlatformService,
    private readonly announcementsService: AnnouncementsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get API overview and feature metadata' })
  overview() {
    return this.appService.getOverview();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get service health status' })
  health() {
    return ok(this.appService.getHealth());
  }

  @Get('public/plans')
  @ApiOperation({
    summary: 'Get public subscription plans for the marketing site',
  })
  getPublicPlans() {
    return ok(this.platformService.getPublicPlans());
  }

  @Get('public/launch-config')
  @ApiOperation({
    summary: 'Get public launch, legal, and tenant billing metadata',
  })
  getPublicLaunchConfig() {
    return ok(this.appService.getPublicLaunchConfig());
  }

  @Get('public/announcements')
  @ApiOperation({
    summary: 'Get active public announcements for marketing and auth surfaces',
  })
  getPublicAnnouncements(@Query() query: ListPublicAnnouncementsQueryDto) {
    return ok(
      this.announcementsService.listPublicAnnouncements(
        query.audience ?? 'public',
      ),
    );
  }
}
