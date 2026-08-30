import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseCleanupService } from './database-cleanup.service';

@Global()
@Module({
  providers: [DatabaseService, DatabaseCleanupService],
  exports: [DatabaseService, DatabaseCleanupService],
})
export class DatabaseModule {}
