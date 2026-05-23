import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateSessionDto } from './dto/create-session.dto';

interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.sessionsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sessionsService.findOne(user.id, id);
  }

  @Post(':id/finalise')
  @HttpCode(HttpStatus.OK)
  finalise(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sessionsService.finalise(user, id);
  }
}
