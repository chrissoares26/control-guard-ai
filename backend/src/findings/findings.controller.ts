import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { FindingsService } from './findings.service';
import { ReviewFindingDto } from './dto/review-finding.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

@Controller('sessions')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Get(':id/findings')
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.findingsService.findAll(user.id, id);
  }

  @Post(':id/findings/:findingId/review')
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('findingId') findingId: string,
    @Body() dto: ReviewFindingDto,
  ) {
    return this.findingsService.review(user, id, findingId, dto);
  }
}
