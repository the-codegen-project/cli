/* eslint-disable no-undef */
/* eslint-disable no-console */
import {getGlobalConfig, updateGlobalConfig} from '../PersistedConfig';
import {Logger} from '../LoggingInterface';

/**
 * Show telemetry notice on first run.
 * This function never throws - fails silently on errors.
 *
 * The notice informs users that telemetry is enabled and how to disable it.
 * After showing the notice once, it sets a flag to prevent showing it again.
 */
export async function showTelemetryNoticeIfNeeded(): Promise<void> {
  try {
    const globalConfig = await getGlobalConfig();

    // Skip if already shown or if telemetry is disabled
    if (
      globalConfig.hasShownTelemetryNotice ||
      !globalConfig.telemetry.enabled
    ) {
      return;
    }

    // Skip in CI environments (no need to show notice)
    if (process.env.CI === 'true' || process.env.CI === '1') {
      return;
    }

    // Show the notice
    Logger.info(`
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  The Codegen Project CLI collects anonymous usage data      │
│  to help us improve the tool.                               │
│                                                             │
│  To disable: codegen telemetry disable                      │
│  Learn more: https://the-codegen-project.org/docs/telemetry │
│                                                             │
└─────────────────────────────────────────────────────────────┘
`);

    // Mark as shown
    globalConfig.hasShownTelemetryNotice = true;
    await updateGlobalConfig(globalConfig);
  } catch (error) {
    // Fail silently - notice is not critical
    if (process.env.CODEGEN_TELEMETRY_DEBUG === '1') {
      Logger.error('[Telemetry Debug] Failed to show notice:', error);
    }
  }
}
