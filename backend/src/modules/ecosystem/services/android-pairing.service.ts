import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as os from 'os';
import * as crypto from 'crypto';
import { IntegrationsService } from './integrations.service';
import { McpRegistryService } from '../../../mcp/core';
import { AndroidBridgeMcpConnector } from '../../../mcp/connectors/android-bridge/android-bridge-mcp.connector';

export interface AndroidPairingSession {
  sessionId: string;
  pinCode: string;
  formattedPin: string;
  createdAt: number;
  expiresAt: number;
  status: 'waiting' | 'confirmed' | 'expired';
  desktopHost: string;
  desktopPort: number;
  confirmUrl: string;
  qrPayloadJson: string;
  deviceInfo?: {
    deviceName: string;
    deviceEndpoint: string;
    androidVersion?: string;
    batteryLevel?: number;
    pairedAt: number;
  };
}

export interface ConfirmPairingDto {
  sessionId: string;
  deviceEndpoint: string;
  pinCode?: string;
  deviceName?: string;
  androidVersion?: string;
  batteryLevel?: number;
}

@Injectable()
export class AndroidPairingService {
  private readonly logger = new Logger(AndroidPairingService.name);
  private readonly sessions = new Map<string, AndroidPairingSession>();

  // TTL: 5 minutes
  private readonly SESSION_TTL_MS = 5 * 60 * 1000;

  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly registry: McpRegistryService,
  ) {
    // Periodic cleanup of expired sessions every 2 minutes
    setInterval(() => this.cleanupExpiredSessions(), 2 * 60 * 1000);
  }

  /**
   * Automatically detect the computer's primary LAN IPv4 address (e.g. 192.168.x.x, 10.x.x.x)
   * so an Android phone on the same Wi-Fi network can connect to ContextForge.
   */
  public getLocalLanIp(): string {
    const interfaces = os.networkInterfaces();
    const candidateIps: string[] = [];

    for (const name of Object.keys(interfaces)) {
      const netList = interfaces[name];
      if (!netList) continue;

      for (const net of netList) {
        // Skip internal (127.0.0.1) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          // Prioritize Wi-Fi and Ethernet subnets
          if (
            net.address.startsWith('192.168.') ||
            net.address.startsWith('10.') ||
            net.address.startsWith('172.')
          ) {
            candidateIps.push(net.address);
          }
        }
      }
    }

    if (candidateIps.length > 0) {
      return candidateIps[0];
    }

    return '127.0.0.1';
  }

  /**
   * Create a new ephemeral pairing session for QR code scanning.
   */
  public createPairingSession(
    customHost?: string,
    port: number = 3001,
  ): AndroidPairingSession {
    const host = customHost || this.getLocalLanIp();
    const sessionId = `pair_${crypto.randomBytes(6).toString('hex')}`;
    const rawPin = Math.floor(100000 + Math.random() * 900000).toString();
    const formattedPin = `${rawPin.slice(0, 3)}-${rawPin.slice(3)}`;
    const now = Date.now();
    const expiresAt = now + this.SESSION_TTL_MS;

    const confirmUrl = `http://${host}:${port}/api/ecosystem/integrations/android/pair/confirm`;

    const qrPayload = {
      protocol: 'contextforge-mcp-bridge',
      version: '1.0',
      sessionId,
      pinCode: rawPin,
      formattedPin,
      confirmUrl,
      desktopHost: host,
      desktopPort: port,
      expiresAt,
    };

    const session: AndroidPairingSession = {
      sessionId,
      pinCode: rawPin,
      formattedPin,
      createdAt: now,
      expiresAt,
      status: 'waiting',
      desktopHost: host,
      desktopPort: port,
      confirmUrl,
      qrPayloadJson: JSON.stringify(qrPayload),
    };

    this.sessions.set(sessionId, session);
    this.logger.log(
      `📱 Created Android QR pairing session [${sessionId}] with PIN [${formattedPin}] for desktop ${host}:${port}`,
    );

    return session;
  }

  /**
   * Check status of a pairing session (used by desktop UI polling/revalidation).
   */
  public getSessionStatus(sessionId: string): AndroidPairingSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(
        `Pairing session "${sessionId}" not found or expired.`,
      );
    }

    if (Date.now() > session.expiresAt && session.status === 'waiting') {
      session.status = 'expired';
    }

    return session;
  }

  /**
   * Handshake endpoint called by the Android mobile app when it scans the QR code.
   */
  public async confirmPairing(dto: ConfirmPairingDto): Promise<{
    success: boolean;
    message: string;
    session: AndroidPairingSession;
  }> {
    const session = this.sessions.get(dto.sessionId);
    if (!session) {
      throw new NotFoundException(
        `Pairing session "${dto.sessionId}" expired or not found. Please regenerate QR Code.`,
      );
    }

    if (Date.now() > session.expiresAt) {
      session.status = 'expired';
      throw new BadRequestException(
        'Pairing session has expired (5-minute limit exceeded). Please refresh QR Code.',
      );
    }

    // Format & normalize device endpoint
    let normalizedEndpoint = dto.deviceEndpoint.trim();
    if (
      !normalizedEndpoint.startsWith('http://') &&
      !normalizedEndpoint.startsWith('https://')
    ) {
      normalizedEndpoint = `http://${normalizedEndpoint}`;
    }

    const deviceName = dto.deviceName || 'Android Mobile Device';

    session.status = 'confirmed';
    session.deviceInfo = {
      deviceName,
      deviceEndpoint: normalizedEndpoint,
      androidVersion: dto.androidVersion,
      batteryLevel: dto.batteryLevel,
      pairedAt: Date.now(),
    };

    this.logger.log(
      `✨ Handshake successful! Android device "${deviceName}" connected at ${normalizedEndpoint} for session [${dto.sessionId}]`,
    );

    // Update ContextForge database integration record for Android Bridge
    try {
      await this.integrationsService.updateIntegration(
        'int-android-bridge-mcp',
        {
          endpoint: normalizedEndpoint,
          status: 'connected',
          auth_config: {
            deviceName,
            androidVersion: dto.androidVersion,
            pairedAt: Date.now(),
            pairedVia: 'qr_code',
          },
        },
      );

      // Reconfigure live MCP Gateway connector
      const androidConnector = this.registry.getServer(
        'int-android-bridge-mcp',
      );
      if (androidConnector instanceof AndroidBridgeMcpConnector) {
        androidConnector.configure({
          endpoint: normalizedEndpoint,
        });
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to persist paired Android bridge to database: ${String(err)}`,
      );
    }

    return {
      success: true,
      message: `Device "${deviceName}" paired successfully!`,
      session,
    };
  }

  /**
   * Manual PIN Verification fallback for situations where the camera QR scanner is unavailable.
   */
  public async verifyByPin(
    pinCode: string,
    deviceEndpoint: string,
    deviceName?: string,
  ): Promise<{
    success: boolean;
    message: string;
    session?: AndroidPairingSession;
  }> {
    const cleanPin = pinCode.replace(/[^0-9]/g, '');
    let matchedSession: AndroidPairingSession | undefined;

    for (const session of this.sessions.values()) {
      if (
        session.pinCode === cleanPin &&
        session.status === 'waiting' &&
        Date.now() <= session.expiresAt
      ) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      throw new BadRequestException(
        'Invalid or expired 6-digit PIN code. Please check the code on your screen.',
      );
    }

    return this.confirmPairing({
      sessionId: matchedSession.sessionId,
      deviceEndpoint,
      deviceName,
    });
  }

  /**
   * Clean up expired pairing sessions from memory
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now > session.expiresAt + 60000) {
        this.sessions.delete(id);
      }
    }
  }
}
