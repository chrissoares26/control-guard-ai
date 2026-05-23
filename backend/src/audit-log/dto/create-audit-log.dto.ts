import { EventType, Outcome } from '@prisma/client';

export interface CreateAuditLogDto {
  eventType: EventType;
  actor: string;
  payload: Record<string, unknown>;
  outcome: Outcome;
  sessionId?: string;
  userId?: string;
  errorDetail?: string;
}
