/* eslint-disable no-undef */
/**
 * Re-export the canonical helper from `src/utils/inputSource.ts`. The
 * telemetry surface is unchanged; the helper now lives next to the rest
 * of the URL-detection code so it can be shared with the input loaders.
 */
export {getInputSourceType} from '../utils/inputSource';

/**
 * Detect if running in a CI environment.
 * Checks common CI environment variables.
 */
export function isCIEnvironment(): boolean {
  return Boolean(
    process.env.CI || // Generic CI indicator
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.CIRCLECI ||
      process.env.TRAVIS ||
      process.env.JENKINS_URL ||
      process.env.BITBUCKET_PIPELINE_UUID ||
      process.env.CODEBUILD_BUILD_ID ||
      process.env.TEAMCITY_VERSION ||
      process.env.BUILDKITE
  );
}

/**
 * Categorize an error for telemetry purposes.
 * Only returns the error category, not the actual error message or details.
 *
 * @param error - The error to categorize
 * @returns Error category string
 */
export function categorizeError(error: unknown): string {
  if (!error) {
    return 'unknown_error';
  }

  const errorMessage =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  // Configuration errors
  if (
    errorMessage.includes('config') ||
    errorMessage.includes('configuration')
  ) {
    return 'configuration_error';
  }

  // File system errors
  if (
    errorMessage.includes('enoent') ||
    errorMessage.includes('file not found')
  ) {
    return 'file_not_found';
  }

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('http')
  ) {
    return 'network_error';
  }

  // Parse errors
  if (errorMessage.includes('parse') || errorMessage.includes('syntax')) {
    return 'parse_error';
  }

  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return 'validation_error';
  }

  // Permission errors
  if (errorMessage.includes('permission') || errorMessage.includes('eacces')) {
    return 'permission_error';
  }

  return 'unknown_error';
}
