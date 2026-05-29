import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit-log/audit-log.service";
import { AiPromptService } from "./ai-prompt.service";
import { validateAiResponse } from "./findings-schema";
import OpenAI from "openai";
import {
  FindingCategory,
  RiskLevel,
  ConfidenceLabel,
  ControlTypeSuggested,
} from "@prisma/client";

interface AnalysisUser {
  id: string;
  username: string;
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly confidenceThreshold: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly aiPrompt: AiPromptService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>("openai.apiKey"),
    });
    this.model = this.config.get<string>("openai.model") || "gpt-4o";
    this.confidenceThreshold =
      this.config.get<number>("confidenceThreshold") || 0.75;
  }

  async analyse(user: AnalysisUser, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { document: true, findings: { select: { id: true } } },
    });
    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== user.id)
      throw new ForbiddenException("Access denied");
    if (session.status === "FINALISED")
      throw new UnprocessableEntityException("Session is finalised");
    if (!session.document)
      throw new NotFoundException("No document uploaded for this session");
    if (session.findings.length > 0)
      throw new ConflictException("Analysis already run for this session");

    const systemPrompt = this.aiPrompt.getSystemPrompt();
    const userPrompt = this.aiPrompt.buildUserPrompt(
      {
        processName: session.processName,
        processOwner: session.processOwner,
        sessionId,
      },
      session.document.sanitisedText,
    );
    const promptHash = this.aiPrompt.hashPrompt(userPrompt);

    await this.auditLog.log({
      eventType: "ai_request_initiated",
      actor: user.username,
      payload: {
        system_prompt_version: systemPrompt.version,
        user_prompt_hash: promptHash,
        model: this.model,
      },
      outcome: "success",
      sessionId,
      userId: user.id,
    });

    let rawResponse: string;
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt.content },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      rawResponse = completion.choices[0]?.message?.content || "";
    } catch (error) {
      await this.auditLog.log({
        eventType: "ai_response_received",
        actor: "SYSTEM",
        payload: {
          error: "OpenAI API call failed",
          message: (error as Error).message,
        },
        outcome: "failure",
        sessionId,
        userId: user.id,
        errorDetail: (error as Error).message,
      });
      throw new InternalServerErrorException(
        "AI analysis failed. Please try again.",
      );
    }

    await this.auditLog.log({
      eventType: "ai_response_received",
      actor: "SYSTEM",
      payload: {
        raw_response_length: rawResponse.length,
        raw_response_preview: rawResponse.slice(0, 200),
      },
      outcome: "success",
      sessionId,
      userId: user.id,
    });

    let parsed: ReturnType<typeof validateAiResponse>;
    try {
      parsed = validateAiResponse(JSON.parse(rawResponse));
    } catch (error) {
      this.logger.error("AI response schema validation failed", {
        rawResponse,
        error,
      });
      await this.auditLog.log({
        eventType: "ai_response_received",
        actor: "SYSTEM",
        payload: { error: "Schema validation failed" },
        outcome: "failure",
        sessionId,
        userId: user.id,
        errorDetail: "Schema validation failed",
      });
      throw new InternalServerErrorException(
        "AI analysis returned invalid data. Please try again.",
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const f of parsed.findings) {
        if (!f.evidence_excerpt?.trim()) continue;
        await tx.finding.create({
          data: {
            sessionId,
            sequence: f.sequence,
            category: f.category as FindingCategory,
            title: f.title,
            description: f.description,
            affectedProcessStep: f.affected_process_step,
            riskLevel: f.risk_level as RiskLevel,
            confidenceScore: f.confidence_score,
            confidenceLabel: f.confidence_label as ConfidenceLabel,
            evidenceExcerpt: f.evidence_excerpt,
            recommendation: f.recommendation,
            controlTypeSuggested:
              f.control_type_suggested as ControlTypeSuggested,
            requiresHumanReview: f.confidence_score < this.confidenceThreshold,
          },
        });
      }
      await tx.session.update({
        where: { id: sessionId },
        data: { status: "ANALYSED" },
      });
    });

    return {
      message: "Analysis complete",
      findingCount: parsed.findings.length,
    };
  }
}
