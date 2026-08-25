import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import * as crypto from 'crypto';
import { IntegrationsService } from './integrations.service';
import { McpRegistryService } from '../../../mcp/core';
import { AndroidBridgeMcpConnector } from '../../../mcp/connectors/android-bridge/android-bridge-mcp.connector';
import { AndroidBridgeGatewayService } from '../../../mcp/connectors/android-bridge/android-bridge.gateway';
import { EcosystemEventsService } from './ecosystem-events.service';

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
  wsUrl: string;
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
export class AndroidPairingService implements OnModuleInit {
  private readonly logger = new Logger(AndroidPairingService.name);
  private readonly sessions = new Map<string, AndroidPairingSession>();

  // TTL: 5 minutes
  private readonly SESSION_TTL_MS = 5 * 60 * 1000;

  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly registry: McpRegistryService,
    @Optional()
    private readonly androidBridgeGateway?: AndroidBridgeGatewayService,
    @Optional() private readonly configService?: ConfigService,
    @Optional()
    private readonly eventsService?: EcosystemEventsService,
  ) {}

  onModuleInit() {
    if (this.androidBridgeGateway) {
      this.androidBridgeGateway.onDeviceConnected((deviceInfo) => {
        void this.handleDeviceConnected(deviceInfo);
      });

      this.androidBridgeGateway.onDeviceDisconnected(() => {
        void this.handleDeviceDisconnected();
      });
    }
  }

  private async handleDeviceDisconnected() {
    this.logger.log(
      '⚡ [AndroidPairingService] Android device disconnected. Updating database to disconnected state.',
    );
    try {
      await this.integrationsService.updateIntegration(
        'int-android-bridge-mcp',
        {
          status: 'disconnected',
        },
      );
    } catch (err: unknown) {
      this.logger.warn(`Failed to update DB on disconnection: ${String(err)}`);
    }
  }

  private async handleDeviceConnected(deviceInfo: {
    deviceName: string;
    androidVersion?: string;
    batteryLevel?: number;
  }) {
    this.logger.log(
      `⚡ [AndroidPairingService] Auto-confirming active pairing sessions & persisting DB for "${deviceInfo.deviceName}"`,
    );

    // 1. Auto-confirm any active waiting pairing sessions
    for (const session of this.sessions.values()) {
      if (session.status === 'waiting') {
        session.status = 'confirmed';
        session.deviceInfo = {
          deviceName: deviceInfo.deviceName,
          deviceEndpoint: `ws://${session.desktopHost}:${session.desktopPort}/api/android-bridge/ws`,
          androidVersion: deviceInfo.androidVersion,
          batteryLevel: deviceInfo.batteryLevel,
          pairedAt: Date.now(),
        };
        this.eventsService?.emitPairingSessionUpdate(
          session.sessionId,
          'confirmed',
          session.deviceInfo,
        );
      }
    }

    // 2. Persist connected status & device info to PostgreSQL Database
    try {
      await this.integrationsService.updateIntegration(
        'int-android-bridge-mcp',
        {
          status: 'connected',
          endpoint: `ws://${this.getLocalLanIp()}:3001/api/android-bridge/ws`,
          auth_config: {
            deviceName: deviceInfo.deviceName,
            androidVersion: deviceInfo.androidVersion,
            batteryLevel: deviceInfo.batteryLevel,
            pairedAt: Date.now(),
            pairedVia: 'websocket_bridge',
          },
        },
      );
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to auto-update DB on WS handshake: ${String(err)}`,
      );
    }
  }

  /**
   * Automatically detect the computer's primary LAN IPv4 address (e.g. 192.168.x.x, 10.x.x.x)
   * so an Android phone on the same Wi-Fi network can connect to ContextForge.
   */
  public getLocalLanIp(): string {
    const configuredIp =
      this.configService?.get<string>('DESKTOP_LAN_IP') ||
      process.env.DESKTOP_LAN_IP;
    if (configuredIp) {
      return configuredIp.trim();
    }

    const interfaces = os.networkInterfaces();
    const wifi192Ips: string[] = [];
    const lan10Ips: string[] = [];
    const otherIps: string[] = [];

    for (const name of Object.keys(interfaces)) {
      const netList = interfaces[name];
      if (!netList) continue;

      for (const net of netList) {
        // Skip internal (127.0.0.1) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          if (net.address.startsWith('192.168.')) {
            wifi192Ips.push(net.address);
          } else if (net.address.startsWith('10.')) {
            lan10Ips.push(net.address);
          } else if (net.address.startsWith('172.')) {
            otherIps.push(net.address);
          }
        }
      }
    }

    if (wifi192Ips.length > 0) return wifi192Ips[0];
    if (lan10Ips.length > 0) return lan10Ips[0];
    if (otherIps.length > 0) return otherIps[0];

    return '127.0.0.1';
  }

  /**
   * Create a new temporary pairing session for desktop-mobile synchronization.
   * Generates a 6-digit numeric PIN and unique Session ID.
   */
  public createSession(
    customHost?: string,
    portOverride?: number,
  ): AndroidPairingSession {
    const sessionId = `pair_${crypto.randomBytes(6).toString('hex')}`;
    const pinNumber = Math.floor(100000 + Math.random() * 900000);
    const pinCode = pinNumber.toString();
    const formattedPin = `${pinCode.slice(0, 3)}-${pinCode.slice(3)}`;

    const host = customHost?.trim() || this.getLocalLanIp();
    const port =
      portOverride || this.configService?.get<number>('app.port', 3001) || 3001;

    const confirmUrl = `http://${host}:${port}/api/ecosystem/integrations/android/pair/confirm`;
    const wsUrl = `ws://${host}:${port}/api/android-bridge/ws`;

    const qrPayload = {
      protocol: 'contextforge-mcp-bridge',
      version: '2.0',
      sessionId,
      pinCode,
      formattedPin,
      confirmUrl,
      wsUrl,
      desktopHost: host,
      desktopPort: port,
      expiresAt: Date.now() + this.SESSION_TTL_MS,
    };

    const session: AndroidPairingSession = {
      sessionId,
      pinCode,
      formattedPin,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.SESSION_TTL_MS,
      status: 'waiting',
      desktopHost: host,
      desktopPort: port,
      confirmUrl,
      wsUrl,
      qrPayloadJson: JSON.stringify(qrPayload),
    };

    // If WebSocket is already connected from the phone, immediately mark session as confirmed
    if (this.androidBridgeGateway?.isDeviceConnected()) {
      const devInfo = this.androidBridgeGateway.getActiveDeviceInfo();
      session.status = 'confirmed';
      session.deviceInfo = {
        deviceName: devInfo.deviceName || 'Android Mobile Device',
        deviceEndpoint: wsUrl,
        androidVersion: devInfo.androidVersion,
        batteryLevel: devInfo.batteryLevel,
        pairedAt: Date.now(),
      };
    }

    this.sessions.set(sessionId, session);
    this.logger.log(
      `📱 Created Android QR pairing session [${sessionId}] with PIN [${formattedPin}] for desktop ${host}:${port}`,
    );

    return session;
  }

  /**
   * Alias for createSession to support both naming styles
   */
  public createPairingSession(
    customHost?: string,
    port?: number,
  ): AndroidPairingSession {
    return this.createSession(customHost, port);
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

    // If WebSocket is connected, auto-confirm any waiting session
    if (
      session.status === 'waiting' &&
      this.androidBridgeGateway?.isDeviceConnected()
    ) {
      const devInfo = this.androidBridgeGateway.getActiveDeviceInfo();
      session.status = 'confirmed';
      session.deviceInfo = {
        deviceName: devInfo.deviceName || 'Android Mobile Device',
        deviceEndpoint: `ws://${session.desktopHost}:${session.desktopPort}/api/android-bridge/ws`,
        androidVersion: devInfo.androidVersion,
        batteryLevel: devInfo.batteryLevel,
        pairedAt: Date.now(),
      };
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
