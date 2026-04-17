import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from './common/http/api-result';
import { AppService } from './app.service';
import { PlatformService } from './platform/platform.service';

@Controller('api/v1')
@ApiTags('Meta')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly platformService: PlatformService,
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
}
