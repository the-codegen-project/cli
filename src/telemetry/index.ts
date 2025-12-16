/* eslint-disable no-undef */
/* eslint-disable no-console */
import {sendEvent} from './sender';
import {showTelemetryNoticeIfNeeded} from './notice';
import {collectSystemInfo} from './collector';
import {TelemetryEvent} from './events';
import {ProjectTelemetryConfig} from '../codegen/types';
import {Logger} from '../LoggingInterface';
export * from './events';
export * from './config';
export * from './anonymize';
export * from './collector';

/**
 * Track a telemetry event.
 *
 * **IMPORTANT**: This function is designed to NEVER throw or reject.
 * It is safe to call without .catch() or try/catch.
 * All errors are handled internally and logged only in debug mode.
 *
 * The function automatically:
 * - Shows first-run notice if needed
 * - Adds system information to the event
 * - Applies project-level config overrides if provided
 * - Sends the event to the configured endpoint
 * - Handles all errors gracefully
 *
 * Priority order for configuration:
 * 1. Environment variables (highest priority)
 * 2. Project-level config (from codegen.config.js)
 * 3. Global config (from ~/.the-codegen-project/config.json)
 *
 * @param event - The event data to track
 * @param projectConfig - Optional project-level telemetry config from codegen.config.js
 * @returns Promise that always resolves (never rejects)
 *
 * @example
 * ```typescript
 * // Fire and forget - safe to call without await or .catch()
 * void trackEvent({
 *   event: 'command_executed',
 *   command: 'generate',
 *   success: true
 * });
 *
 * // With project config override
 * void trackEvent({
 *   event: 'generator_used',
 *   generator_type: 'payloads'
 * }, config.telemetry);
 * ```
 */
export async function trackEvent(
  event: TelemetryEvent,
  projectConfig?: ProjectTelemetryConfig
): Promise<void> {
  try {
    // Debug mode: log the event being tracked
    if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
      Logger.info(
        '[Telemetry Debug] Tracking event:',
        JSON.stringify(event, null, 2)
      );
    }

    // Show notice on first run (also safe, never throws)
    await showTelemetryNoticeIfNeeded();

    // Add system information to event
    const enrichedEvent = {
      ...event,
      ...collectSystemInfo()
    };

    // Send event with project config (also safe, never throws)
    await sendEvent(enrichedEvent, projectConfig);
  } catch (error) {
    // This should never happen, but just in case
    if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
      Logger.error('[Telemetry Debug] Unexpected error in trackEvent:', error);
    }
    // Always resolve
  }
}
