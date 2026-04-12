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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import type { AuthenticatedUser } from '../common/http/request-context';
import { GetNotificationUnreadCountQueryDto } from './dto/get-notification-unread-count-query.dto';
import { ListUserNotificationsQueryDto } from './dto/list-user-notifications-query.dto';
import { MarkAllNotificationsReadDto } from './dto/mark-all-notifications-read.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationsService } from './notifications.service';

@Controller('api/v1/users/me')
@UseGuards(AuthGuard)
@ApiTags('Notifications')
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  @ApiOperation({ summary: 'List inbox notifications for the current user' })
  listNotifications(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListUserNotificationsQueryDto,
  ) {
    return this.notificationsService.listNotifications(currentUser, query);
  }

  @Get('notifications/unread-count')
  @ApiOperation({ summary: 'Get unread notification count for the current user' })
  getUnreadCount(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: GetNotificationUnreadCountQueryDto,
  ) {
    return ok(this.notificationsService.getUnreadCount(currentUser, query));
  }

  @Patch('notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('notificationId') notificationId: string,
  ) {
    return ok(
      this.notificationsService.markNotificationRead(
        currentUser,
        notificationId,
      ),
    );
  }

  @Post('notifications/read-all')
  @ApiOperation({ summary: 'Mark notifications as read in bulk' })
  markAllRead(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: MarkAllNotificationsReadDto,
  ) {
    return ok(this.notificationsService.markAllRead(currentUser, body));
  }

  @Get('notification-preferences')
  @ApiOperation({ summary: 'Get notification preferences for the current user' })
  getPreferences(@CurrentUser() currentUser: AuthenticatedUser) {
    return ok(this.notificationsService.getPreferences(currentUser));
  }

  @Patch('notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences for the current user' })
  updatePreferences(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return ok(this.notificationsService.updatePreferences(currentUser, body));
  }
}
