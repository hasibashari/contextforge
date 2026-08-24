import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface ResolvedPathResult {
  rawInput: string;
  resolvedPath: string;
  isAccessible: boolean;
  platform: 'windows' | 'wsl' | 'linux' | 'darwin' | 'docker' | 'unknown';
}

/**
 * Universal Cross-Platform Path Resolver
 * Handles transparent path translation across Windows Native, WSL, Linux, macOS, and Cloud/Docker containers.
 */
export class UniversalPathResolver {
  private static cachedIsWsl: boolean | null = null;
  private static cachedIsDocker: boolean | null = null;

  /**
   * Detects if the current Node.js runtime is running inside WSL (Windows Subsystem for Linux)
   */
  public static isWsl(): boolean {
    if (this.cachedIsWsl !== null) return this.cachedIsWsl;

    if (process.platform !== 'linux') {
      this.cachedIsWsl = false;
      return false;
    }

    try {
      if (fs.existsSync('/proc/version')) {
        const version = fs.readFileSync('/proc/version', 'utf-8').toLowerCase();
        this.cachedIsWsl =
          version.includes('microsoft') || version.includes('wsl');
        return this.cachedIsWsl;
      }
    } catch {
      // Fallback
    }

    this.cachedIsWsl = false;
    return false;
  }

  /**
   * Detects if the current Node.js runtime is running inside a Docker container
   */
  public static isDocker(): boolean {
    if (this.cachedIsDocker !== null) return this.cachedIsDocker;

    try {
      this.cachedIsDocker =
        fs.existsSync('/.dockerenv') ||
        (fs.existsSync('/proc/1/cgroup') &&
          fs.readFileSync('/proc/1/cgroup', 'utf-8').includes('docker'));
      return this.cachedIsDocker;
    } catch {
      this.cachedIsDocker = false;
      return false;
    }
  }

  /**
   * Identifies current platform category
   */
  public static getPlatform(): ResolvedPathResult['platform'] {
    if (this.isWsl()) return 'wsl';
    if (this.isDocker()) return 'docker';
    if (process.platform === 'win32') return 'windows';
    if (process.platform === 'darwin') return 'darwin';
    if (process.platform === 'linux') return 'linux';
    return 'unknown';
  }

  /**
   * Resolves any input path into a canonical local path for the current OS runtime
   */
  public static resolve(rawInput: string): ResolvedPathResult {
    if (!rawInput || !rawInput.trim()) {
      return {
        rawInput: '',
        resolvedPath: '',
        isAccessible: false,
        platform: this.getPlatform(),
      };
    }

    let clean = rawInput.trim().replace(/^["']|["']$/g, '');

    // 1. Expand Windows Environment Variables (e.g. %USERPROFILE%, %APPDATA%)
    clean = clean.replace(/%([^%]+)%/g, (_, n: string) => process.env[n] || '');

    // 2. Expand Unix / Mac Environment Variables (e.g. $HOME, $USER)
    clean = clean.replace(
      /\$([a-zA-Z_][a-zA-Z0-9_]*)/g,
      (_, n: string) => process.env[n] || '',
    );

    const currentPlatform = this.getPlatform();
    let normalized = clean;

    // Check if input is a Windows Drive Path (e.g., C:\Users\... or C:/Users/...)
    const winDriveMatch = clean.match(/^([a-zA-Z]):[\\/](.*)/);

    const isPhysicalPath =
      clean.startsWith('/') ||
      clean.startsWith('~') ||
      clean.startsWith('./') ||
      clean.startsWith('../') ||
      clean.startsWith('/mnt/') ||
      Boolean(winDriveMatch);

    if (!isPhysicalPath) {
      return {
        rawInput,
        resolvedPath: 'dynamic-client-vault',
        isAccessible: true,
        platform: currentPlatform,
      };
    }

    if (
      currentPlatform === 'wsl' ||
      currentPlatform === 'linux' ||
      currentPlatform === 'docker'
    ) {
      if (winDriveMatch) {
        const driveLetter = winDriveMatch[1].toLowerCase();
        const restPath = winDriveMatch[2].replace(/\\/g, '/');
        normalized = `/mnt/${driveLetter}/${restPath}`;
      } else if (clean.startsWith('~')) {
        normalized = path.join(os.homedir(), clean.slice(1));
      } else if (clean.startsWith('/')) {
        normalized = clean;
      } else {
        normalized = path.resolve(clean);
      }
    } else if (currentPlatform === 'windows') {
      // Running on Native Windows Node.js
      if (clean.startsWith('/mnt/')) {
        const mntMatch = clean.match(/^\/mnt\/([a-zA-Z])\/(.*)/);
        if (mntMatch) {
          const driveLetter = mntMatch[1].toUpperCase();
          const restPath = mntMatch[2].replace(/\//g, '\\');
          normalized = `${driveLetter}:\\${restPath}`;
        }
      } else if (clean.startsWith('~')) {
        normalized = path.join(os.homedir(), clean.slice(1));
      } else if (/^[a-zA-Z]:[\\/]/.test(clean)) {
        normalized = clean;
      } else {
        normalized = path.resolve(clean);
      }
    } else {
      // macOS or standard Unix
      if (clean.startsWith('~')) {
        normalized = path.join(os.homedir(), clean.slice(1));
      } else if (clean.startsWith('/')) {
        normalized = clean;
      } else {
        normalized = path.resolve(clean);
      }
    }

    // Check if path is physically accessible on the current host
    let isAccessible = false;
    try {
      isAccessible = fs.existsSync(normalized);
    } catch {
      isAccessible = false;
    }

    return {
      rawInput,
      resolvedPath: normalized,
      isAccessible,
      platform: currentPlatform,
    };
  }

  /**
   * Safely resolves a relative subpath strictly within base root (blocks path traversal)
   */
  public static sanitizeSubPath(
    baseRoot: string,
    relativeSubPath: string,
  ): string | null {
    if (!baseRoot) return null;

    const sanitizedRel = (relativeSubPath || '')
      .replace(/\0/g, '')
      .replace(/^(\.\.(\/|\\|$))+/, '');

    const resolved = path.resolve(baseRoot, sanitizedRel);
    const rootWithSep = baseRoot.endsWith(path.sep)
      ? baseRoot
      : baseRoot + path.sep;

    if (resolved.startsWith(rootWithSep) || resolved === baseRoot) {
      return resolved;
    }

    return null;
  }

  /**
   * Generates standard Obsidian URI Scheme for 1-click desktop deep link
   */
  public static buildObsidianUri(
    vaultName: string,
    fileRelPath: string,
    content?: string,
  ): string {
    const cleanVault = encodeURIComponent(vaultName || 'Obsidian Vault');
    const cleanFile = encodeURIComponent(fileRelPath.replace(/\.md$/, ''));

    let uri = `obsidian://new?vault=${cleanVault}&file=${cleanFile}`;
    if (content) {
      uri += `&content=${encodeURIComponent(content)}`;
    }
    return uri;
  }
}
