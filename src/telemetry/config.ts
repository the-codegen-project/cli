/* eslint-disable no-undef */
/* eslint-disable no-console */
import {Logger} from '../LoggingInterface';
import {
  getGlobalConfig,
  updateGlobalConfig,
  TelemetryConfig
} from '../PersistedConfig';
import {ProjectTelemetryConfig} from '../codegen/types';

/**
 * Get telemetry configuration with proper priority order.
 * This function never throws - returns disabled config on any error.
 *
 * Priority order (highest to lowest):
 * 1. Environment variable overrides (highest priority):
 *    - CODEGEN_TELEMETRY_DISABLED / DO_NOT_TRACK: disable telemetry
 *    - CODEGEN_TELEMETRY_ENDPOINT: custom analytics endpoint
 *    - CODEGEN_TELEMETRY_ID: custom tracking ID
 *    - CODEGEN_TELEMETRY_API_SECRET: custom API secret
 * 2. Project-level config (from codegen.config.js)
 * 3. Global config file (~/.the-codegen-project/config.json)
 *
 * @param projectConfig - Optional project-level telemetry config from codegen.config.js
 * @returns Promise resolving to telemetry configuration
 */
export async function getTelemetryConfig(
  projectConfig?: ProjectTelemetryConfig
): Promise<TelemetryConfig> {
  try {
    const globalConfig = await getGlobalConfig();
    const telemetryConfig = {
      ...globalConfig.telemetry,
      ...(projectConfig ?? {})
    };

    // Apply environment variable overrides (highest priority)
    if (
      process.env.CODEGEN_TELEMETRY_DISABLED === '1' ||
      process.env.DO_NOT_TRACK
    ) {
      telemetryConfig.enabled = false;
    }

    if (process.env.CODEGEN_TELEMETRY_ENDPOINT) {
      telemetryConfig.endpoint = process.env.CODEGEN_TELEMETRY_ENDPOINT;
    }

    if (process.env.CODEGEN_TELEMETRY_ID) {
      telemetryConfig.trackingId = process.env.CODEGEN_TELEMETRY_ID;
    }

    if (process.env.CODEGEN_TELEMETRY_API_SECRET) {
      telemetryConfig.apiSecret = process.env.CODEGEN_TELEMETRY_API_SECRET;
    }

    return telemetryConfig;
  } catch (error) {
    // On any error, return disabled config
    if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
      Logger.error('Failed to get telemetry config:', error);
    }
    return createDisabledTelemetryConfig();
  }
}

/**
 * Enable telemetry.
 * Updates the global config file to enable telemetry.
 * This function never throws - fails silently on errors.
 */
export async function setTelemetryEnabled(enabled: boolean): Promise<void> {
  try {
    const globalConfig = await getGlobalConfig();
    globalConfig.telemetry.enabled = enabled;
    await updateGlobalConfig(globalConfig);
  } catch (error) {
    if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
      Logger.error('Failed to set telemetry enabled state:', error);
    }
    // Fail silently
  }
}

/**
 * Check if telemetry is enabled.
 * Checks environment variables and global config.
 *
 * @returns Promise resolving to true if telemetry is enabled, false otherwise
 */
export async function isTelemetryEnabled(): Promise<boolean> {
  const config = await getTelemetryConfig();
  return config.enabled;
}

/**
 * Create a disabled telemetry configuration.
 */
function createDisabledTelemetryConfig(): TelemetryConfig {
  return {
    enabled: false,
    anonymousId: '',
    endpoint: '',
    trackingId: '',
    apiSecret: ''
  };
}
