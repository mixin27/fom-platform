import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ok } from '../common/http/api-result';
import { AuthGuard } from '../common/http/auth.guard';
import { CurrentUser } from '../common/http/current-user.decorator';
import type { AuthenticatedUser } from '../common/http/request-context';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto';
import { UsersService } from './users.service';

@Controller('api/v1/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getCurrentUser(@CurrentUser() currentUser: AuthenticatedUser) {
    return ok(this.usersService.getCurrentUser(currentUser));
  }

  @Patch('me')
  updateCurrentUser(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() body: UpdateCurrentUserDto,
  ) {
    return ok(this.usersService.updateCurrentUser(currentUser, body));
  }
}
