import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateSessionDto } from './dto/create-session.dto';

interface SessionUser {
  id: string;
  username: string;
}

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(user: SessionUser, dto: CreateSessionDto) {
    const session = await this.prisma.$transaction(async (tx) => {
      const created = await tx.session.create({
        data: {
          name: dto.name,
          processName: dto.processName,
          processOwner: dto.processOwner,
          userId: user.id,
        },
      });
      await tx.auditLogEntry.create({
        data: {
          eventType: 'session_created',
          actor: user.username,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: { session_name: dto.name, process_name: dto.processName, process_owner: dto.processOwner } as any,
          outcome: 'success',
          sessionId: created.id,
          userId: user.id,
        },
      });
      return created;
    });
    return session;
  }

  async findAll(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { findings: true } },
        findings: { where: { reviewStatus: 'pending' }, select: { id: true } },
      },
    });
    return sessions.map((s) => ({
      id: s.id,
      name: s.name,
      processName: s.processName,
      processOwner: s.processOwner,
      status: s.status,
      createdAt: s.createdAt,
      finalisedAt: s.finalisedAt,
      findingCount: s._count.findings,
      pendingCount: s.findings.length,
    }));
  }

  async findOne(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        document: {
          select: { id: true, filename: true, fileSize: true, format: true, wordCount: true, uploadedAt: true },
        },
        _count: { select: { findings: true } },
        findings: { select: { reviewStatus: true, requiresHumanReview: true } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Access denied');

    const total = session.findings.length;
    const pending = session.findings.filter((f) => f.reviewStatus === 'pending').length;
    const accepted = session.findings.filter((f) => f.reviewStatus === 'accepted').length;
    const edited = session.findings.filter((f) => f.reviewStatus === 'edited').length;
    const dismissed = session.findings.filter((f) => f.reviewStatus === 'dismissed').length;
    const flaggedForReview = session.findings.filter((f) => f.requiresHumanReview).length;

    return {
      id: session.id,
      name: session.name,
      processName: session.processName,
      processOwner: session.processOwner,
      status: session.status,
      createdAt: session.createdAt,
      finalisedAt: session.finalisedAt,
      document: session.document,
      findingSummary: { total, pending, accepted, edited, dismissed, flaggedForReview },
    };
  }

  async finalise(user: SessionUser, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { findings: { where: { reviewStatus: 'pending' }, select: { id: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== user.id) throw new ForbiddenException('Access denied');
    if (session.status === 'FINALISED') {
      throw new UnprocessableEntityException('Session is already finalised');
    }
    if (session.findings.length > 0) {
      throw new ConflictException({
        message: `Cannot finalise: ${session.findings.length} finding(s) still pending review`,
        pendingCount: session.findings.length,
      });
    }

    const allFindings = await this.prisma.finding.findMany({
      where: { sessionId },
      select: { reviewStatus: true },
    });
    const counts = { accepted: 0, dismissed: 0, edited: 0 };
    for (const f of allFindings) {
      if (f.reviewStatus === 'accepted') counts.accepted++;
      else if (f.reviewStatus === 'dismissed') counts.dismissed++;
      else if (f.reviewStatus === 'edited') counts.edited++;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const finalised = await tx.session.update({
        where: { id: sessionId },
        data: { status: 'FINALISED', finalisedAt: new Date() },
      });
      await tx.auditLogEntry.create({
        data: {
          eventType: 'session_finalised',
          actor: user.username,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: { total_findings: allFindings.length, ...counts } as any,
          outcome: 'success',
          sessionId,
          userId: user.id,
        },
      });
      return finalised;
    });

    return { id: updated.id, status: updated.status, finalisedAt: updated.finalisedAt };
  }
}
