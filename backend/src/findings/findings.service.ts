import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ReviewFindingDto, ReviewActionEnum } from "./dto/review-finding.dto";
import { ReviewAction } from "@prisma/client";

interface ReviewUser {
  id: string;
  username: string;
}

@Injectable()
export class FindingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== userId)
      throw new ForbiddenException("Access denied");

    return this.prisma.finding.findMany({
      where: { sessionId },
      orderBy: { sequence: "asc" },
      include: { reviewerDecision: true },
    });
  }

  async review(
    user: ReviewUser,
    sessionId: string,
    findingId: string,
    dto: ReviewFindingDto,
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== user.id)
      throw new ForbiddenException("Access denied");
    if (session.status === "FINALISED")
      throw new UnprocessableEntityException("Session is finalised");

    const finding = await this.prisma.finding.findUnique({
      where: { id: findingId },
      include: { reviewerDecision: true },
    });
    if (!finding || finding.sessionId !== sessionId)
      throw new NotFoundException("Finding not found");
    if (finding.reviewerDecision)
      throw new ConflictException("Finding has already been reviewed");

    const action = dto.action as ReviewAction;
    const finalRecommendation =
      dto.action === ReviewActionEnum.edited
        ? dto.finalRecommendation!
        : finding.recommendation;

    await this.prisma.$transaction(async (tx) => {
      await tx.reviewerDecision.create({
        data: {
          findingId,
          decidedBy: user.username,
          action,
          originalRecommendation: finding.recommendation,
          finalRecommendation,
          reviewerNote: dto.reviewerNote,
        },
      });
      await tx.finding.update({
        where: { id: findingId },
        data: { reviewStatus: dto.action },
      });
      await tx.auditLogEntry.create({
        data: {
          eventType: "finding_reviewed",
          actor: user.username,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: {
            finding_id: findingId,
            action: dto.action,
            confidence_score: finding.confidenceScore,
            had_edit: dto.action === ReviewActionEnum.edited,
            note_provided: !!dto.reviewerNote,
          } as any,
          outcome: "success",
          sessionId,
          userId: user.id,
        },
      });

      if (session.status === "ANALYSED") {
        await tx.session.update({
          where: { id: sessionId },
          data: { status: "IN_REVIEW" },
        });
      }
    });

    return this.prisma.finding.findUnique({
      where: { id: findingId },
      include: { reviewerDecision: true },
    });
  }
}
