import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const connectionString = this.configService.get<string>('database.url');
    const max = this.configService.get<number>('database.maxConnections', 20);
    const idleTimeoutMillis = this.configService.get<number>(
      'database.idleTimeoutMillis',
      30000,
    );
    const connectionTimeoutMillis = this.configService.get<number>(
      'database.connectionTimeoutMillis',
      5000,
    );

    const isSupabase =
      connectionString?.includes('supabase.co') ||
      connectionString?.includes('pooler.supabase.com');
    const isSslNeeded =
      isSupabase ||
      process.env.NODE_ENV === 'production' ||
      connectionString?.includes('sslmode=require');

    this.pool = new Pool({
      connectionString,
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
      ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
    });

    this.pool.on('error', (err: Error) => {
      this.logger.error(
        'Unexpected error on idle PostgreSQL client',
        err.stack,
      );
    });

    try {
      const client = await this.pool.connect();
      const res = await client.query<{ version: string }>('SELECT version();');
      const versionStr = res.rows[0]?.version?.split(' ')[1] || '16';
      this.logger.log(`🚀 Connected to PostgreSQL successfully: ${versionStr}`);
      client.release();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `❌ Failed to connect to PostgreSQL database: ${errorMsg}`,
        errorStack,
      );
    }
  }

  /**
   * Execute parameterized SQL query with type-safety and slow-query logging
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      const slowQueryThreshold = this.configService.get<number>(
        'database.slowQueryThreshold',
        1000,
      );
      if (duration > slowQueryThreshold) {
        this.logger.warn(
          `⚠️ Slow query (${duration}ms): ${text.replace(/\s+/g, ' ').slice(0, 120)}...`,
        );
      }
      return res;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Database query error: ${errorMsg} | Query: ${text.slice(0, 100)}`,
        errorStack,
      );
      throw err;
    }
  }

  /**
   * Execute multiple operations within an ACID transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e: unknown) {
      await client.query('ROLLBACK');
      const errorMsg = e instanceof Error ? e.message : String(e);
      const errorStack = e instanceof Error ? e.stack : undefined;
      this.logger.error(
        `Transaction rollback due to error: ${errorMsg}`,
        errorStack,
      );
      throw e;
    } finally {
      client.release();
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async onModuleDestroy() {
    if (this.pool) {
      this.logger.log('Closing PostgreSQL connection pool...');
      await this.pool.end();
    }
  }
}
