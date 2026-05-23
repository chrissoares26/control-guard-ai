import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { SessionsModule } from './sessions/sessions.module';
import { DocumentsModule } from './documents/documents.module';
import { AnalysisModule } from './analysis/analysis.module';
import { FindingsModule } from './findings/findings.module';
import { ReportsModule } from './reports/reports.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuditLogModule,
    AuthModule,
    SessionsModule,
    DocumentsModule,
    AnalysisModule,
    FindingsModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
