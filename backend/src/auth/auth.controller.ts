import { Controller, Post, Get, Body, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';

interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Request() req: { ip: string; headers: Record<string, string> }) {
    try {
      const result = await this.authService.login(dto.email, dto.password);
      await this.auditLogService.log({
        eventType: 'auth_event',
        actor: result.user.username,
        payload: { event_subtype: 'login', email: dto.email, user_agent: req.headers['user-agent'] || 'unknown' },
        outcome: 'success',
        userId: result.user.id,
      });
      return result;
    } catch (error) {
      await this.auditLogService.log({
        eventType: 'auth_event',
        actor: 'anonymous',
        payload: { event_subtype: 'failed_login', email: dto.email },
        outcome: 'failure',
      });
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.auditLogService.log({
      eventType: 'auth_event',
      actor: user.username,
      payload: { event_subtype: 'logout' },
      outcome: 'success',
      userId: user.id,
    });
    return { message: 'Logged out' };
  }

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }
}
