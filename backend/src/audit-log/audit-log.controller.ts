import { Controller, Get, Param, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

@Controller('sessions')
export class AuditLogController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':id/audit-log')
  async findBySession(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== user.id) throw new ForbiddenException('Access denied');
    return this.auditLogService.findBySession(id);
  }
}
