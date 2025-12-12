import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import {v4 as uuidv4} from 'uuid';

/**
 * Global configuration interface stored in ~/.the-codegen-project/config.json
 * This configuration persists across all projects and CLI sessions.
 */
export interface GlobalConfig {
  version: string;
  telemetry: TelemetryConfig;
  hasShownTelemetryNotice: boolean;
  lastUpdated?: string;
  // Future extensibility:
  // updates?: UpdatePreferences;
  // preferences?: UserPreferences;
}

/**
 * Telemetry configuration interface
 */
export interface TelemetryConfig {
  enabled: boolean;
  anonymousId: string;
  endpoint: string;
  trackingId: string;
  apiSecret?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.the-codegen-project');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Get global configuration.
 * Creates default config if it doesn't exist.
 * This function never throws - returns default config on any error.
 */
export async function getGlobalConfig(): Promise<GlobalConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Config doesn't exist or is invalid, create default
    return await createDefaultGlobalConfig();
  }
}

/**
 * Update global configuration.
 * Creates config directory if it doesn't exist.
 * This function never throws - fails silently on errors.
 */
export async function updateGlobalConfig(config: GlobalConfig): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, {recursive: true});
    config.lastUpdated = new Date().toISOString();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch {
    // Fail silently - config update is not critical
    // Debug logging intentionally omitted to avoid dependencies
  }
}

/**
 * Create default global configuration with telemetry enabled.
 * Uses GA4 Measurement Protocol as the default endpoint.
 */
async function createDefaultGlobalConfig(): Promise<GlobalConfig> {
  const globalConfig: GlobalConfig = {
    version: '1.0.0',
    telemetry: {
      enabled: true,
      anonymousId: uuidv4(),
      endpoint: 'https://www.google-analytics.com/mp/collect',
      trackingId: 'G-45KZ589PCT',
      apiSecret: 'emUAvwyZRDqCKYbmvWUM9g' // NOTE: is OKAY to be committed as its a public API secret
    },
    hasShownTelemetryNotice: false,
    lastUpdated: new Date().toISOString()
  };

  await updateGlobalConfig(globalConfig);
  return globalConfig;
}

/**
 * Check if the global config file exists.
 */
export async function configFileExists(): Promise<boolean> {
  try {
    await fs.access(CONFIG_FILE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the path to the global config file.
 * Useful for debugging and testing.
 */
export function getConfigFilePath(): string {
  return CONFIG_FILE;
}

/**
 * Get the path to the config directory.
 * Useful for debugging and testing.
 */
export function getConfigDirectoryPath(): string {
  return CONFIG_DIR;
}
