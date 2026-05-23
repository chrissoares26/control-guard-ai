import { Controller, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

@Controller('sessions')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post(':id/analyse')
  @HttpCode(HttpStatus.ACCEPTED)
  analyse(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.analysisService.analyse(user, id);
  }
}
