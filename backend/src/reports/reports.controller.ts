import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

@Controller('sessions')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get(':id/report')
  async getReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.reportsService.generate(user.id, id);
    await this.auditLog.log({
      eventType: 'report_exported',
      actor: user.username,
      payload: {
        report_filename: `controlguard-report-${id}.pdf`,
        session_id: id,
        exported_by: user.username,
      },
      outcome: 'success',
      sessionId: id,
      userId: user.id,
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="controlguard-report-${id}.pdf"`,
      'Content-Length': pdf.length.toString(),
    });
    res.end(pdf);
  }
}
