import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAuditLogDto } from "./dto/create-audit-log.dto";

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    return this.prisma.auditLogEntry.create({
      data: {
        eventType: dto.eventType,
        actor: dto.actor,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: dto.payload as any,
        outcome: dto.outcome,
        sessionId: dto.sessionId,
        userId: dto.userId,
        errorDetail: dto.errorDetail,
      },
    });
  }

  async findBySession(sessionId: string) {
    return this.prisma.auditLogEntry.findMany({
      where: { sessionId },
      orderBy: { eventTimestamp: "asc" },
    });
  }
}
