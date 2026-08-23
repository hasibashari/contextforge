import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;

  constructor() {
    const rawSecret =
      process.env.APP_SECRET ||
      process.env.ENCRYPTION_KEY ||
      process.env.JWT_SECRET ||
      'contextforge-production-master-secret-key-2026';

    // Derive strict 32-byte key for AES-256 via SHA-256
    this.secretKey = crypto.createHash('sha256').update(rawSecret).digest();
  }

  /**
   * Encrypts plaintext string using AES-256-GCM
   * Output format: enc:v1:<iv_hex>:<authTag_hex>:<cipher_hex>
   */
  encrypt(plainText: string): string {
    if (!plainText || typeof plainText !== 'string') return '';
    if (this.isEncrypted(plainText)) return plainText; // Idempotent

    try {
      const iv = crypto.randomBytes(12); // Standard 12 bytes for GCM
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');
      return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Encryption error: ${msg}`);
      return plainText;
    }
  }

  /**
   * Decrypts an AES-256-GCM encrypted token
   */
  decrypt(cipherString: string): string {
    if (!cipherString || typeof cipherString !== 'string') return '';
    if (!this.isEncrypted(cipherString)) return cipherString; // If plaintext, return as-is

    try {
      const parts = cipherString.split(':');
      if (parts.length !== 5 || parts[0] !== 'enc' || parts[1] !== 'v1') {
        return cipherString;
      }

      const iv = Buffer.from(parts[2], 'hex');
      const authTag = Buffer.from(parts[3], 'hex');
      const encryptedText = parts[4];

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Decryption failed, falling back to raw: ${msg}`);
      return cipherString;
    }
  }

  /**
   * Checks whether a string has the encrypted prefix signature
   */
  isEncrypted(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return text.startsWith('enc:v1:');
  }

  /**
   * Masks a secret token for secure display in UI (e.g. ntn_****a1b2 or sec_****8f9a)
   */
  maskSecret(secret: string): string {
    if (!secret || typeof secret !== 'string') return '';
    const raw = this.decrypt(secret);
    if (!raw) return '';

    if (raw.length <= 8) {
      return '••••••••';
    }

    const prefix = raw.slice(0, 4);
    const suffix = raw.slice(-4);
    return `${prefix}••••••••${suffix}`;
  }

  /**
   * Recursively sanitizes/masks sensitive keys in an auth config object before sending to client
   */
  maskAuthConfig<T extends Record<string, unknown>>(authConfig: T): T {
    if (!authConfig || typeof authConfig !== 'object') return authConfig;

    const copy = { ...authConfig } as Record<string, unknown>;
    const sensitiveKeys = ['token', 'apiKey', 'password', 'secret', 'key'];

    for (const key of Object.keys(copy)) {
      if (
        sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))
      ) {
        const val = copy[key];
        if (typeof val === 'string' && val) {
          copy[key] = this.maskSecret(val);
        }
      }
    }

    return copy as T;
  }
}
