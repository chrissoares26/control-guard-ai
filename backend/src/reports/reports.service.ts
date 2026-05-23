import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(userId: string, sessionId: string): Promise<Buffer> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        document: true,
        findings: {
          orderBy: { sequence: 'asc' },
          include: { reviewerDecision: true },
        },
        auditLogs: { orderBy: { eventTimestamp: 'asc' } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new UnprocessableEntityException('Access denied');
    if (session.status !== 'FINALISED') throw new UnprocessableEntityException('Session must be finalised before exporting');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const accepted = session.findings.filter((f) => ['accepted', 'edited'].includes(f.reviewStatus));
      const dismissed = session.findings.filter((f) => f.reviewStatus === 'dismissed');

      // Cover page
      doc.fontSize(20).font('Helvetica-Bold').text('ControlGuard AI', { align: 'center' });
      doc.fontSize(16).font('Helvetica').text('Internal Controls Evaluation Report', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(12).text(`Session: ${session.name}`);
      doc.text(`Process: ${session.processName}`);
      doc.text(`Process Owner: ${session.processOwner}`);
      doc.text(`Finalised: ${session.finalisedAt?.toISOString() || 'N/A'}`);
      doc.text(`Export Date: ${new Date().toISOString()}`);
      doc.moveDown(2);

      // Disclosure
      doc.fontSize(10).font('Helvetica-Oblique')
        .text('DISCLOSURE: The findings in this report were generated with AI assistance (ControlGuard AI) and reviewed by a qualified human auditor. Every finding included in this report reflects an explicit acceptance decision made by the reviewing auditor.');
      doc.moveDown(2);

      // Accepted findings
      doc.fontSize(14).font('Helvetica-Bold').text('Accepted Findings');
      doc.moveDown();
      if (accepted.length === 0) {
        doc.fontSize(11).font('Helvetica').text('No findings were accepted.');
      } else {
        for (const finding of accepted) {
          doc.fontSize(12).font('Helvetica-Bold').text(`${finding.sequence}. ${finding.title}`);
          doc.fontSize(10).font('Helvetica')
            .text(`Risk: ${finding.riskLevel.toUpperCase()} | Confidence: ${Math.round(finding.confidenceScore * 100)}% | Category: ${finding.category}`);
          doc.moveDown(0.5);
          doc.text(`Evidence: "${finding.evidenceExcerpt}"`);
          doc.moveDown(0.5);
          doc.text(`Recommendation: ${finding.reviewerDecision?.finalRecommendation || finding.recommendation}`);
          if (finding.reviewerDecision) {
            doc.text(`Reviewed by: ${finding.reviewerDecision.decidedBy} at ${finding.reviewerDecision.decidedAt.toISOString()}`);
          }
          doc.moveDown();
        }
      }

      // Dismissed findings summary
      if (dismissed.length > 0) {
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Dismissed Findings');
        doc.moveDown();
        for (const finding of dismissed) {
          doc.fontSize(12).font('Helvetica-Bold').text(`${finding.sequence}. ${finding.title}`);
          doc.fontSize(10).font('Helvetica')
            .text(`Justification: ${finding.reviewerDecision?.reviewerNote || 'No justification provided'}`);
          doc.moveDown();
        }
      }

      // Audit trail appendix
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text('Audit Trail Appendix');
      doc.moveDown();
      doc.fontSize(9).font('Helvetica');

      const logsToShow = session.auditLogs.slice(0, 200);
      for (const entry of logsToShow) {
        doc.text(
          `[${entry.eventTimestamp.toISOString()}] ${entry.eventType} | Actor: ${entry.actor} | ${entry.outcome}`,
          { lineGap: 2 },
        );
      }

      doc.end();
    });
  }
}
