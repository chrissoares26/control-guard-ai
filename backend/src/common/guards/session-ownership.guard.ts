import { Injectable, CanActivate, ExecutionContext, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Reusable guard for session-scoped routes. Extracts :id from route params,
// loads the session, and rejects if session.userId !== authenticated user.
// NOTE: Individual services also perform this check inside transactions
// for defence-in-depth; this guard provides an early rejection at the HTTP layer.
@Injectable()
export class SessionOwnershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user: { id: string }; params: { id?: string } }>();
    const sessionId = request.params.id;
    if (!sessionId) return true;

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== request.user.id) throw new ForbiddenException('Access denied');

    return true;
  }
}
