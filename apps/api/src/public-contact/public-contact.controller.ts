import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/http/api-result';
import type { RequestWithContext } from '../common/http/request-context';
import { CreatePublicContactSubmissionDto } from './dto/create-public-contact-submission.dto';
import { PublicContactService } from './public-contact.service';

@Controller('api/v1/public/contact')
@ApiTags('Public')
export class PublicContactController {
  constructor(private readonly publicContactService: PublicContactService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a public contact form (rate limited)' })
  async submit(
    @Body() body: CreatePublicContactSubmissionDto,
    @Req() request: RequestWithContext,
  ) {
    const result = await this.publicContactService.submitFromPublic(
      body,
      request,
    );
    return ok(result);
  }
}
