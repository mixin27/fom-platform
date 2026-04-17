import { PartialType } from '@nestjs/swagger';
import { CreateMessengerAutoReplyRuleDto } from './create-messenger-auto-reply-rule.dto';

export class UpdateMessengerAutoReplyRuleDto extends PartialType(
  CreateMessengerAutoReplyRuleDto,
) {}
