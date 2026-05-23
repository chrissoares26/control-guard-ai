import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SanitisationService } from './sanitisation.service';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

interface UploadUser {
  id: string;
  username: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sanitisation: SanitisationService,
  ) {}

  async upload(user: UploadUser, sessionId: string, file: Express.Multer.File) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { document: { select: { id: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== user.id) throw new ForbiddenException('Access denied');
    if (session.status === 'FINALISED') {
      throw new UnprocessableEntityException('Cannot upload to a finalised session');
    }
    if (session.document) {
      throw new ConflictException('Session already has a document');
    }

    const extractedText = await this.extractText(file);
    if (!extractedText.trim()) {
      throw new BadRequestException('Could not extract text from the uploaded document. Ensure it is a text-based PDF or DOCX.');
    }

    const sanitisationResult = this.sanitisation.sanitise(extractedText);
    const wordCount = sanitisationResult.sanitisedText.split(/\s+/).filter(Boolean).length;
    const format = file.mimetype === 'application/pdf' ? 'pdf' : 'docx';

    const document = await this.prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          sessionId,
          filename: file.originalname,
          fileSize: file.size,
          format,
          extractedText,
          sanitisedText: sanitisationResult.sanitisedText,
          wordCount,
          sanitisationApplied: sanitisationResult.sanitisationApplied,
        },
      });
      await tx.auditLogEntry.create({
        data: {
          eventType: 'document_uploaded',
          actor: user.username,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: {
            filename: file.originalname,
            file_size: file.size,
            word_count: wordCount,
            sanitisation_applied: sanitisationResult.sanitisationApplied,
          } as any,
          outcome: 'success',
          sessionId,
          userId: user.id,
        },
      });
      return created;
    });

    return {
      id: document.id,
      filename: document.filename,
      fileSize: document.fileSize,
      format: document.format,
      wordCount: document.wordCount,
      sanitisationApplied: document.sanitisationApplied,
      uploadedAt: document.uploadedAt,
    };
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      return data.text;
    } else {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }
  }
}
