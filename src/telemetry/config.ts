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
 * 1. DO_NOT_TRACK or CODEGEN_TELEMETRY_DISABLED environment variables
 * 2. Environment variable overrides (endpoint, tracking ID, API secret)
 * 3. Project-level config (from codegen.config.js)
 * 4. Global config file (~/.the-codegen-project/config.json)
 *
 * @param projectConfig - Optional project-level telemetry config from codegen.config.js
 * @returns Promise resolving to telemetry configuration
 */
export async function getTelemetryConfig(
  projectConfig?: ProjectTelemetryConfig
): Promise<TelemetryConfig> {
  try {
    // 1. Check environment variables first (highest priority for disable)
    if (
      process.env.CODEGEN_TELEMETRY_DISABLED === '1' ||
      process.env.DO_NOT_TRACK === '1'
    ) {
      return createDisabledTelemetryConfig();
    }

    // 2. Get global config as base
    const globalConfig = await getGlobalConfig();
    const telemetryConfig = {...globalConfig.telemetry};

    // 3. Apply project-level overrides if provided
    if (projectConfig) {
      if (projectConfig.enabled !== undefined) {
        telemetryConfig.enabled = projectConfig.enabled;
      }
      if (projectConfig.endpoint) {
        telemetryConfig.endpoint = projectConfig.endpoint;
      }
      if (projectConfig.trackingId) {
        telemetryConfig.trackingId = projectConfig.trackingId;
      }
    }

    // 4. Apply environment variable overrides (highest priority for values)
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
    trackingId: ''
  };
}
