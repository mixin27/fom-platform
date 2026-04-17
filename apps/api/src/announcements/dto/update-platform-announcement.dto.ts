import { PartialType } from '@nestjs/swagger';
import { CreatePlatformAnnouncementDto } from './create-platform-announcement.dto';

export class UpdatePlatformAnnouncementDto extends PartialType(
  CreatePlatformAnnouncementDto,
) {}
