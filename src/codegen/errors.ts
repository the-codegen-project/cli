/**
 * Custom error types for better error handling and user-friendly messages
 */
import pc from 'picocolors';

export enum ErrorType {
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_PARSE_ERROR = 'CONFIG_PARSE_ERROR',
  CONFIG_VALIDATION_ERROR = 'CONFIG_VALIDATION_ERROR',
  INVALID_PRESET = 'INVALID_PRESET',
  INVALID_INPUT_TYPE = 'INVALID_INPUT_TYPE',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INPUT_DOCUMENT_ERROR = 'INPUT_DOCUMENT_ERROR',
  GENERATOR_ERROR = 'GENERATOR_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
  MISSING_INPUT_DOCUMENT = 'MISSING_INPUT_DOCUMENT',
  MISSING_PAYLOAD = 'MISSING_PAYLOAD',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  DUPLICATE_GENERATOR_ID = 'DUPLICATE_GENERATOR_ID',
  UNSUPPORTED_PRESET_FOR_INPUT = 'UNSUPPORTED_PRESET_FOR_INPUT'
}

export interface CodegenErrorDetails {
  type: ErrorType;
  message: string;
  help?: string;
  details?: string;
}

export class CodegenError extends Error {
  public readonly type: ErrorType;
  public readonly help?: string;
  public readonly details?: string;

  constructor({type, message, help, details}: CodegenErrorDetails) {
    super(message);
    this.name = 'CodegenError';
    this.type = type;
    this.help = help;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CodegenError);
    }
  }

  /**
   * Format the error message for display to users
   * @param useColors Whether to use colored output
   */
  public format(useColors = true): string {
    const c = useColors
      ? pc
      : {
          red: (s: string) => s,
          yellow: (s: string) => s,
          cyan: (s: string) => s,
          dim: (s: string) => s,
          bold: (s: string) => s
        };

    let output = `\n${c.red(c.bold('Error:'))} ${this.message}`;

    if (this.details) {
      output += `\n\n${c.yellow('Details:')}\n${c.dim(this.details)}`;
    }

    if (this.help) {
      output += `\n\n${c.cyan('How to fix:')}\n${this.help}`;
    }

    return output;
  }
}

/**
 * Helper functions to create specific error types
 */

export function createConfigNotFoundError(options?: {
  filePath?: string;
  searchLocations?: string[];
}): CodegenError {
  const {filePath, searchLocations} = options ?? {};
  if (filePath) {
    return new CodegenError({
      type: ErrorType.CONFIG_NOT_FOUND,
      message: `Configuration file not found at: ${filePath}`,
      help: `Please check that the file exists and the path is correct.\nYou can create a configuration file using: codegen init`
    });
  }

  const locations =
    searchLocations?.map((loc) => `  - ${loc}`).join('\n') || '';
  return new CodegenError({
    type: ErrorType.CONFIG_NOT_FOUND,
    message: 'No configuration file found in the current directory',
    details: `Searched in the following locations:\n${locations}`,
    help: `Create a configuration file using: codegen init\nOr specify a configuration file path: codegen generate <path-to-config>`
  });
}

export function createConfigParseError(options: {
  filePath: string;
  originalError: Error;
}): CodegenError {
  const {filePath, originalError} = options;
  return new CodegenError({
    type: ErrorType.CONFIG_PARSE_ERROR,
    message: `Failed to parse configuration file: ${filePath}`,
    details: originalError.message,
    help: `Check that your configuration file is valid JSON, YAML, or JavaScript.\nMake sure there are no syntax errors in the file.`
  });
}

export function createInvalidPresetError(options: {
  preset: string;
  language: string;
}): CodegenError {
  const {preset, language} = options;
  const validPresets = [
    'payloads',
    'parameters',
    'headers',
    'types',
    'channels',
    'client',
    'models',
    'custom'
  ];
  const presetList = validPresets.map((p) => `  - ${p}`).join('\n');

  return new CodegenError({
    type: ErrorType.INVALID_PRESET,
    message: `Invalid preset '${preset}' for language '${language}'`,
    details: `Valid presets are:\n${presetList}`,
    help: `Update your configuration to use a valid preset.\nFor more information, visit: https://the-codegen-project.org/docs/generators`
  });
}

export function createInvalidInputTypeError(options: {
  inputType: string;
}): CodegenError {
  const {inputType} = options;
  const validTypes = ['asyncapi', 'openapi', 'jsonschema'];
  const typeList = validTypes.map((t) => `  - ${t}`).join('\n');

  return new CodegenError({
    type: ErrorType.INVALID_INPUT_TYPE,
    message: `Invalid input type '${inputType}'`,
    details: `Valid input types are:\n${typeList}`,
    help: `Update your configuration to use a valid inputType.\nFor more information, visit: https://the-codegen-project.org/docs/category/inputs`
  });
}

export function createMissingRequiredFieldError(options: {
  field: string;
  location?: string;
}): CodegenError {
  const {field, location} = options;
  const locationSuffix = location ? ` at "${location}"` : '';
  return new CodegenError({
    type: ErrorType.MISSING_REQUIRED_FIELD,
    message: `Missing required field: ${field}${locationSuffix}`,
    help: `Add the required '${field}' field to your configuration file.\nFor more information, visit: https://the-codegen-project.org/docs/configurations/`
  });
}

export function createConfigValidationError(options: {
  validationErrors: string[];
}): CodegenError {
  const {validationErrors} = options;
  return new CodegenError({
    type: ErrorType.CONFIG_VALIDATION_ERROR,
    message: 'Configuration validation failed',
    details: validationErrors.join('\n'),
    help: `Review and fix the validation errors in your configuration file.\nFor more information, visit: https://the-codegen-project.org/docs/configurations/`
  });
}

function detectFormatHint(inputPath: string): 'JSON' | 'YAML' | 'JSON or YAML' {
  if (inputPath.endsWith('.json')) {
    return 'JSON';
  }
  if (inputPath.endsWith('.yaml') || inputPath.endsWith('.yml')) {
    return 'YAML';
  }
  return 'JSON or YAML';
}

export function createInputDocumentError(options: {
  inputPath: string;
  inputType: string;
  errorMessage: string;
}): CodegenError {
  const {inputPath, inputType, errorMessage} = options;
  const isUrl =
    inputPath.startsWith('http://') || inputPath.startsWith('https://');
  const formatHint = detectFormatHint(inputPath);
  const sourceHelp = isUrl
    ? `Check that the URL is reachable and returns a valid ${formatHint} document.`
    : `Check that the input file exists and is a valid ${formatHint} file.`;
  return new CodegenError({
    type: ErrorType.INPUT_DOCUMENT_ERROR,
    message: `Failed to load ${inputType} document: ${inputPath}`,
    details: errorMessage,
    help: `${sourceHelp}\nEnsure the document conforms to the ${inputType} specification.`
  });
}

/**
 * Build a typed error for a failed remote fetch. Help text is tailored
 * to the HTTP status code (401/403 → auth, 404 → URL, 429 → rate-limit,
 * timeout → timeout, network → connectivity, other → generic).
 */
function remoteFetchHelp(
  url: string,
  reason: 'timeout' | 'network' | 'http' | undefined,
  status: number | undefined,
  cause: unknown
): string {
  if (reason === 'timeout') {
    return 'The request timed out. Increase the timeout, retry, or check that the host is reachable.';
  }
  if (status === 401 || status === 403) {
    return `Authentication or authorization failed for ${url}. Check the 'auth' field in your configuration (token, header name, header value).`;
  }
  if (status === 404) {
    return `The URL ${url} returned 404. Verify the URL is correct and the resource exists.`;
  }
  if (status === 429) {
    return `The server is rate-limiting requests to ${url}. Retry later or reduce the request rate.`;
  }
  if (status && status >= 500) {
    return `The server returned a ${status} error for ${url}. The remote service may be temporarily unavailable; retry later.`;
  }
  if (reason === 'network' || (!status && cause)) {
    return `Could not reach ${url}. Check your network connection, DNS, and any firewall/proxy settings.`;
  }
  return `Could not fetch ${url}.`;
}

function formatStatusPart(
  status: number | undefined,
  statusText: string | undefined
): string {
  if (!status) {
    return '';
  }
  const trailing = statusText ? ` ${statusText}` : '';
  return ` (HTTP ${status}${trailing})`;
}

function stringifyCause(cause: unknown): string {
  if (cause instanceof Error) {
    return cause.message;
  }
  if (cause === undefined) {
    return '';
  }
  return String(cause);
}

export function createRemoteFetchError(options: {
  url: string;
  status?: number;
  statusText?: string;
  cause?: unknown;
  reason?: 'timeout' | 'network' | 'http';
}): CodegenError {
  const {url, status, statusText, cause, reason} = options;
  const help = remoteFetchHelp(url, reason, status, cause);
  const statusPart = formatStatusPart(status, statusText);
  const causePart = stringifyCause(cause);

  return new CodegenError({
    type: ErrorType.INPUT_DOCUMENT_ERROR,
    message: `Failed to fetch remote document from ${url}${statusPart}`,
    details: causePart || undefined,
    help
  });
}

export function createGeneratorError(options: {
  generatorId: string;
  originalError: Error;
}): CodegenError {
  const {generatorId, originalError} = options;
  return new CodegenError({
    type: ErrorType.GENERATOR_ERROR,
    message: `Generator '${generatorId}' failed`,
    details: originalError.message,
    help: `Check the generator configuration and input document.\nIf the issue persists, please report it at: https://github.com/the-codegen-project/cli/issues`
  });
}

export function createUnsupportedLanguageError(options: {
  preset: string;
  language: string;
}): CodegenError {
  const {preset, language} = options;
  return new CodegenError({
    type: ErrorType.UNSUPPORTED_LANGUAGE,
    message: `Language '${language}' is not supported for the '${preset}' preset`,
    details: `Currently only 'typescript' is supported.`,
    help: `Change the 'language' field in your configuration to 'typescript'.\nFor more information: https://the-codegen-project.org/docs/configurations`
  });
}

export function createMissingInputDocumentError(options: {
  expectedType: 'asyncapi' | 'openapi' | 'jsonschema';
  generatorPreset?: string;
}): CodegenError {
  const {expectedType, generatorPreset} = options;
  const presetContext = generatorPreset
    ? ` for the '${generatorPreset}' generator`
    : '';
  return new CodegenError({
    type: ErrorType.MISSING_INPUT_DOCUMENT,
    message: `Expected ${expectedType} document${presetContext}, but none was provided`,
    help: `1. Ensure your configuration has 'inputType: "${expectedType}"'\n2. Verify 'inputPath' points to a valid ${expectedType} document\n3. Check the document exists and is readable\n\nFor more information: https://the-codegen-project.org/docs/inputs/${expectedType}`
  });
}

export function createMissingPayloadError(options: {
  channelOrOperation: string;
  protocol?: string;
}): CodegenError {
  const {channelOrOperation, protocol} = options;
  const protocolContext = protocol ? ` for ${protocol}` : '';
  return new CodegenError({
    type: ErrorType.MISSING_PAYLOAD,
    message: `Could not find payload for '${channelOrOperation}'${protocolContext}`,
    help: `1. Ensure the 'payloads' generator is configured before 'channels'\n2. Check that your spec defines message payloads for this channel\n3. Verify the channel/operation name matches the spec\n\nFor more information: https://the-codegen-project.org/docs/generators/channels`
  });
}

export function createMissingParameterError(options: {
  channelOrOperation: string;
  protocol?: string;
}): CodegenError {
  const {channelOrOperation, protocol} = options;
  const protocolContext = protocol ? ` for ${protocol}` : '';
  return new CodegenError({
    type: ErrorType.MISSING_PARAMETER,
    message: `Could not find parameter for '${channelOrOperation}'${protocolContext}`,
    help: `1. Ensure the 'parameters' generator is configured before 'channels'\n2. Check that your spec defines parameters for this channel\n3. Verify the channel/operation name matches the spec\n\nFor more information: https://the-codegen-project.org/docs/generators/channels`
  });
}

export function createCircularDependencyError(options?: {
  generatorIds?: string[];
}): CodegenError {
  const generatorIds = options?.generatorIds;
  const idsContext = generatorIds?.length
    ? `\nInvolved generators: ${generatorIds.join(', ')}`
    : '';
  return new CodegenError({
    type: ErrorType.CIRCULAR_DEPENDENCY,
    message: `Circular dependency detected in generator configuration${idsContext}`,
    help: `Review the 'dependencies' field in your generators to remove circular references.\nGenerators are executed in dependency order - ensure there's no A->B->A cycle.\n\nFor more information: https://the-codegen-project.org/docs/configurations`
  });
}

export function createDuplicateGeneratorIdError(options: {
  duplicateIds: string[];
}): CodegenError {
  const {duplicateIds} = options;
  return new CodegenError({
    type: ErrorType.DUPLICATE_GENERATOR_ID,
    message: `Duplicate generator IDs found: ${duplicateIds.join(', ')}`,
    help: `Each generator must have a unique 'id'. Either:\n1. Remove duplicate generators\n2. Give each generator a unique 'id' field\n\nFor more information: https://the-codegen-project.org/docs/configurations`
  });
}

export function createUnsupportedPresetForInputError(options: {
  preset: string;
  inputType: string;
  supportedPresets: string[];
}): CodegenError {
  const {preset, inputType, supportedPresets} = options;
  return new CodegenError({
    type: ErrorType.UNSUPPORTED_PRESET_FOR_INPUT,
    message: `Preset '${preset}' is not supported with '${inputType}' input`,
    details: `Supported presets for ${inputType}: ${supportedPresets.join(', ')}`,
    help: `Change your generator to use a supported preset, or change your input type.\n\nFor more information: https://the-codegen-project.org/docs/generators`
  });
}

export function createMissingDependencyOutputError(options: {
  generatorPreset: string;
  dependencyName: string;
}): CodegenError {
  const {generatorPreset, dependencyName} = options;
  return new CodegenError({
    type: ErrorType.GENERATOR_ERROR,
    message: `Internal error: Missing dependency output '${dependencyName}' for '${generatorPreset}' generator`,
    help: `This is likely a bug. Please report it at: https://github.com/the-codegen-project/cli/issues`
  });
}

/**
 * Parse Zod validation errors and convert them to user-friendly messages
 */
export function parseZodErrors(zodError: any): string[] {
  const errors: string[] = [];

  if (zodError.issues) {
    for (const error of zodError.issues) {
      const path = error.path.join('.');
      const message = error.message;

      // Handle specific error types
      if (error.code === 'invalid_union_discriminator') {
        const expected = error.options?.join("' | '") || '';
        errors.push(`Invalid value at "${path}". Expected: '${expected}'`);
      } else if (error.code === 'invalid_type') {
        errors.push(
          `Invalid type at "${path}". Expected ${error.expected}, got ${error.received}`
        );
      } else if (error.code === 'invalid_literal') {
        errors.push(
          `Invalid value at "${path}". Expected: '${error.expected}'`
        );
      } else {
        errors.push(`${message} at "${path}"`);
      }
    }
  }

  return errors;
}
