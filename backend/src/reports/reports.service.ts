import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private formatPdfDate(date: Date): string {
    const d = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return d.replace(',', '')
  }

  private getAuditOutcomeLabel(entry: { eventType: string; outcome: string; payload: unknown }): string {
    const p = entry.payload as Record<string, unknown> | null
    if (entry.eventType === 'finding_reviewed') {
      if (p?.action === 'accepted' || p?.action === 'edited') return 'Approved'
      if (p?.action === 'dismissed') return 'Rejected'
    }
    if (entry.eventType === 'session_finalised') return 'Finalised'
    if (entry.eventType === 'report_exported') return 'Exported'
    if (entry.outcome === 'failure') return 'Failed'
    return 'Success'
  }

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
      doc.text(`Finalised: ${session.finalisedAt ? this.formatPdfDate(session.finalisedAt) : 'N/A'}`);
      doc.text(`Export Date: ${this.formatPdfDate(new Date())}`);
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
            doc.text(`Reviewed by: ${finding.reviewerDecision.decidedBy} at ${this.formatPdfDate(finding.reviewerDecision.decidedAt)}`);
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
      doc.moveDown(0.5);

      const cols = { timestamp: 50, event: 160, actor: 335, outcome: 430 };
      const pageBottom = 780;

      // Header row
      const headerY = doc.y;
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('Timestamp', cols.timestamp, headerY, { width: 105, lineBreak: false });
      doc.text('Event', cols.event, headerY, { width: 170, lineBreak: false });
      doc.text('Actor', cols.actor, headerY, { width: 90, lineBreak: false });
      doc.text('Outcome', cols.outcome, headerY, { width: 115 });
      doc.moveDown(0.2);
      const dividerY = doc.y;
      doc.moveTo(50, dividerY).lineTo(545, dividerY).stroke();
      doc.moveDown(0.3);

      // Data rows
      doc.fontSize(8).font('Helvetica');
      const logsToShow = session.auditLogs.slice(0, 200);
      for (const entry of logsToShow) {
        if (doc.y > pageBottom) doc.addPage();
        const rowY = doc.y;
        doc.text(this.formatPdfDate(entry.eventTimestamp), cols.timestamp, rowY, { width: 105, lineBreak: false });
        doc.text(entry.eventType.replace(/_/g, ' '), cols.event, rowY, { width: 170, lineBreak: false });
        doc.text(entry.actor, cols.actor, rowY, { width: 90, lineBreak: false });
        doc.text(this.getAuditOutcomeLabel(entry), cols.outcome, rowY, { width: 115 });
        doc.moveDown(0.15);
      }

      doc.end();
    });
  }
}
