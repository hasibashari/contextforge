import { Injectable, Logger } from '@nestjs/common';
import { RawData } from 'ws';
import { AndroidDeviceInfo } from '../android-bridge.types';

export interface DecodedRpcResponse {
  isResponse: boolean;
  reqId: string | null;
  hasExplicitError: boolean;
  responseData?: unknown;
  errorMessage?: string;
}

@Injectable()
export class AndroidProtocolService {
  private readonly logger = new Logger(AndroidProtocolService.name);

  /**
   * Decodes incoming RawData buffer or string into a JSON object
   */
  parseRawMessage(rawData: RawData): Record<string, unknown> | null {
    try {
      const text =
        typeof rawData === 'string'
          ? rawData
          : Buffer.isBuffer(rawData)
            ? rawData.toString('utf-8')
            : Array.isArray(rawData)
              ? Buffer.concat(rawData).toString('utf-8')
              : Buffer.from(rawData).toString('utf-8');
      return JSON.parse(text) as Record<string, unknown>;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to parse WebSocket frame JSON: ${msg}`);
      return null;
    }
  }

  /**
   * Evaluates if a message is an RPC response and extracts normalized data/errors
   */
  evaluateRpcResponse(message: Record<string, unknown>): DecodedRpcResponse {
    if (!message.id) {
      return { isResponse: false, reqId: null, hasExplicitError: false };
    }

    const rawId = message.id;
    const reqId =
      typeof rawId === 'string'
        ? rawId
        : typeof rawId === 'number'
          ? String(rawId)
          : null;

    const statusStr =
      typeof message.status === 'string' ? message.status.toLowerCase() : '';
    const hasExplicitError =
      message.success === false ||
      statusStr === 'error' ||
      statusStr === 'fail' ||
      statusStr === 'failed';

    let responseData: unknown;
    if (message.data !== undefined) {
      responseData = message.data;
    } else if (message.result !== undefined) {
      responseData = message.result;
    } else if (message.payload !== undefined) {
      responseData = message.payload;
    } else {
      const rest = { ...message };
      delete rest.id;
      delete rest.type;
      delete rest.action;
      delete rest.status;
      delete rest.success;
      delete rest.timestamp;
      responseData = Object.keys(rest).length > 0 ? rest : message;
    }

    const errorMessage = hasExplicitError
      ? (typeof message.error === 'string' ? message.error : '') ||
        (typeof message.message === 'string' ? message.message : '') ||
        `Bridge RPC error (status: ${statusStr || String(message.success)})`
      : undefined;

    return {
      isResponse: true,
      reqId,
      hasExplicitError,
      responseData,
      errorMessage,
    };
  }

  /**
   * Checks if message is a device handshake or registration report
   */
  isDeviceReport(message: Record<string, unknown>): boolean {
    const type = typeof message.type === 'string' ? message.type : '';
    const action = typeof message.action === 'string' ? message.action : '';
    return (
      type === 'android_handshake' ||
      type === 'device_status' ||
      type === 'handshake' ||
      type === 'client_hello' ||
      type === 'register_device' ||
      action === 'handshake' ||
      action === 'get_device_status' ||
      action === 'device_info' ||
      action === 'device_status'
    );
  }

  /**
   * Extracts structured AndroidDeviceInfo from a handshake or device report
   */
  extractDeviceInfo(
    message: Record<string, unknown>,
    currentInfo: AndroidDeviceInfo,
    clientIp: string,
    deviceId: string,
  ): AndroidDeviceInfo {
    const payload =
      (message.payload as Record<string, unknown>) ||
      (message.data as Record<string, unknown>) ||
      message;

    const deviceName =
      (payload.deviceName as string) ||
      (payload.device_name as string) ||
      (payload.model as string) ||
      currentInfo.deviceName ||
      'Android Mobile Device';

    const androidVersion =
      (payload.androidVersion as string) ||
      (payload.android_version as string) ||
      (payload.osVersion as string) ||
      (payload.os_version as string) ||
      currentInfo.androidVersion;

    const batteryLevel =
      typeof payload.batteryLevel === 'number'
        ? payload.batteryLevel
        : typeof payload.battery_level === 'number'
          ? payload.battery_level
          : currentInfo.batteryLevel;

    return {
      connected: true,
      deviceId,
      deviceName,
      androidVersion,
      batteryLevel,
      clientIp,
      connectedAt: currentInfo.connectedAt || Date.now(),
      lastPingAt: Date.now(),
    };
  }

  /**
   * Checks if message is a ping heartbeat
   */
  isPing(message: Record<string, unknown>): boolean {
    return message.type === 'ping' || message.action === 'ping';
  }
}
