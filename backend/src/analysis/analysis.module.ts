import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { AiPromptService } from './ai-prompt.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [AnalysisService, AiPromptService],
  controllers: [AnalysisController],
})
export class AnalysisModule {}
