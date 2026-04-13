import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import type { AuthenticatedUser } from '../common/http/request-context';
import { RegisterPushDeviceDto } from './dto/register-push-device.dto';
import { PushService } from './push.service';

@Controller('api/v1/push/devices')
@UseGuards(AuthGuard)
@ApiTags('Push')
@ApiBearerAuth('access-token')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post()
  @ApiOperation({ summary: 'Register or update a push-capable device' })
  registerDevice(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: RegisterPushDeviceDto,
  ) {
    return ok(this.pushService.registerDevice(currentUser, body));
  }

  @Delete(':deviceId')
  @ApiOperation({ summary: 'Deactivate a previously registered push device' })
  unregisterDevice(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('deviceId') deviceId: string,
  ) {
    return ok(this.pushService.unregisterDevice(currentUser, deviceId));
  }
}
