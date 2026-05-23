import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { SanitisationService } from './sanitisation.service';

@Module({
  providers: [DocumentsService, SanitisationService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
