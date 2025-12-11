/* eslint-disable no-undef */
import os from 'os';
import {isCIEnvironment} from './anonymize';

/**
 * Get CLI version from package.json
 */
export function getCliVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require('../../package.json');
    return packageJson.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Get Node.js version
 */
export function getNodeVersion(): string {
  return process.version;
}

/**
 * Get operating system platform
 */
export function getOSPlatform(): string {
  return os.platform();
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return isCIEnvironment();
}

/**
 * Collect common system information for telemetry events.
 * This data is added to all telemetry events.
 */
export function collectSystemInfo(): {
  cli_version: string;
  node_version: string;
  os: string;
  ci: boolean;
} {
  return {
    cli_version: getCliVersion(),
    node_version: getNodeVersion(),
    os: getOSPlatform(),
    ci: isCI()
  };
}
