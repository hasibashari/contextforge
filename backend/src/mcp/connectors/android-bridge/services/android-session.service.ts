import { Injectable, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../../../../common/database/database.service';
import { AndroidDeviceInfo } from '../android-bridge.types';

@Injectable()
export class AndroidSessionService {
  private readonly logger = new Logger(AndroidSessionService.name);

  constructor(@Optional() private readonly db?: DatabaseService) {}

  /**
   * Upserts the active device presence session in PostgreSQL
   */
  async upsertSession(
    info: AndroidDeviceInfo,
    instanceId: string,
  ): Promise<void> {
    if (!this.db) return;
    const deviceId = info.deviceId || 'default-android-device';
    try {
      await this.db.query(
        `INSERT INTO android_device_sessions (
           device_id, device_name, instance_id, is_online, battery_level, 
           android_version, client_ip, last_heartbeat_at, connected_at, updated_at
         ) VALUES ($1, $2, $3, true, $4, $5, $6, NOW(), NOW(), NOW())
         ON CONFLICT (device_id) DO UPDATE SET
           device_name = EXCLUDED.device_name,
           instance_id = EXCLUDED.instance_id,
           is_online = true,
           battery_level = COALESCE(EXCLUDED.battery_level, android_device_sessions.battery_level),
           android_version = COALESCE(EXCLUDED.android_version, android_device_sessions.android_version),
           client_ip = EXCLUDED.client_ip,
           last_heartbeat_at = NOW(),
           updated_at = NOW()`,
        [
          deviceId,
          info.deviceName || 'Android Mobile Device',
          instanceId,
          info.batteryLevel ?? null,
          info.androidVersion ?? null,
          info.clientIp ?? 'unknown',
        ],
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to upsert device session in database: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Updates last heartbeat timestamp and telemetry in PostgreSQL
   */
  async updateHeartbeat(
    deviceId: string,
    instanceId: string,
    batteryLevel?: number,
    androidVersion?: string,
  ): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.query(
        `UPDATE android_device_sessions 
         SET last_heartbeat_at = NOW(),
             is_online = true,
             instance_id = $2,
             battery_level = COALESCE($3, battery_level),
             android_version = COALESCE($4, android_version),
             updated_at = NOW()
         WHERE device_id = $1`,
        [deviceId, instanceId, batteryLevel ?? null, androidVersion ?? null],
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to update device heartbeat in database: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Marks a device session as offline in PostgreSQL
   */
  async markOffline(deviceId: string, instanceId: string): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.query(
        `UPDATE android_device_sessions 
         SET is_online = false, updated_at = NOW() 
         WHERE device_id = $1 AND instance_id = $2`,
        [deviceId, instanceId],
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to mark device ${deviceId} offline in database: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Check if any active device is connected across any Cloud Run instance
   */
  async isOnlineDistributed(localConnected: boolean): Promise<boolean> {
    if (localConnected) return true;
    if (!this.db) return false;
    try {
      const res = await this.db.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM android_device_sessions 
         WHERE is_online = true AND last_heartbeat_at > NOW() - INTERVAL '45 seconds'`,
      );
      return parseInt(res.rows[0]?.count || '0', 10) > 0;
    } catch {
      return localConnected;
    }
  }
}
