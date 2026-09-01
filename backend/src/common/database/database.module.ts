import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseCleanupService } from './database-cleanup.service';
import { PostgresPubSubService } from './postgres-pubsub.service';

@Global()
@Module({
  providers: [DatabaseService, DatabaseCleanupService, PostgresPubSubService],
  exports: [DatabaseService, DatabaseCleanupService, PostgresPubSubService],
})
export class DatabaseModule {}
