/* eslint-disable no-undef */
/* eslint-disable no-console */
import https from 'https';
import {getTelemetryConfig} from './config';
import {TelemetryEvent} from './events';
import {ProjectTelemetryConfig} from '../codegen/types';
import {Logger} from '../LoggingInterface';

/**
 * Send telemetry event to tracking endpoint.
 *
 * **CRITICAL**: This function is designed to NEVER throw or reject.
 * All errors are handled internally and logged only in debug mode.
 * It is safe to call without .catch() or try/catch.
 *
 * @param event - The telemetry event to send
 * @param projectConfig - Optional project-level telemetry config
 * @returns Promise that always resolves (never rejects)
 */
export async function sendEvent(
  event: TelemetryEvent,
  projectConfig?: ProjectTelemetryConfig
): Promise<void> {
  try {
    const config = await getTelemetryConfig(projectConfig);

    // Don't send if telemetry is disabled
    if (config.enabled === false) {
      if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
        Logger.info(
          `[Telemetry Debug] Telemetry is disabled (${JSON.stringify(config)}), skipping send`
        );
      }
      return;
    }

    // Don't send if required config is missing
    if (!config.endpoint || !config.trackingId || !config.anonymousId) {
      if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
        Logger.info(
          `[Telemetry Debug] Missing required config (${JSON.stringify(config)}), skipping send`
        );
      }
      return;
    }

    // Build GA4 Measurement Protocol payload
    const payload = {
      client_id: config.anonymousId,
      events: [
        {
          name: event.event,
          params: {
            ...Object.fromEntries(Object.entries(event).filter(([key]) => key !== 'event')),
            // Use provided engagement time or duration, fallback to 100ms minimum
            engagement_time_msec:
              String(event.duration || 100)
          }
        }
      ]
    };

    // Debug mode: log event without sending
    if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
      Logger.info(
        '[Telemetry Debug] Prepared event:',
        JSON.stringify(payload, null, 2)
      );
    }

    // Build URL with query parameters
    const url = new URL(config.endpoint);
    url.searchParams.set('measurement_id', config.trackingId);
    if (config.apiSecret) {
      url.searchParams.set('api_secret', config.apiSecret);
    }

    // Send to endpoint
    await sendHttpRequest({url: url.toString(), payload});
  } catch (error) {
    // Catch any unexpected errors (config issues, JSON stringify errors, etc.)
    if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
      Logger.error('[Telemetry Debug] Error:', error);
    }
    // Always resolve, never reject
  }
}

/**
 * Send HTTP POST request.
 * This function never throws - all errors are handled internally.
 *
 * @param params - Request parameters
 * @returns Promise that always resolves
 */
async function sendHttpRequest(params: {
  url: string;
  payload: any;
}): Promise<void> {
  const {url, payload} = params;

  return new Promise((resolve) => {
    try {
      const data = JSON.stringify(payload);

      const req = https.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          },
          timeout: 1000 // Fail fast
        },
        (res) => {
          // Log success in debug mode
          if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
            Logger.info(
              `[Telemetry Debug] Send succeeded with status: ${res.statusCode}`
            );
          }
          // Don't wait for response body, resolve immediately
          resolve();
        }
      );

      req.on('error', (err) => {
        // Fail silently, don't break CLI
        if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
          Logger.error(`[Telemetry Debug] Send failed: ${err.message}`);
        }
        resolve();
      });
      req.on('timeout', () => {
        req.destroy();
        resolve();
      });

      req.write(data);
      req.end();
    } catch (error) {
      // Catch any unexpected errors
      if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
        Logger.error('[Telemetry Debug] Request error:', error);
      }
      resolve();
    }
  });
}
