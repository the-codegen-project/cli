/**
 * Custom error types for better error handling and user-friendly messages
 */

export enum ErrorType {
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_PARSE_ERROR = 'CONFIG_PARSE_ERROR',
  CONFIG_VALIDATION_ERROR = 'CONFIG_VALIDATION_ERROR',
  INVALID_PRESET = 'INVALID_PRESET',
  INVALID_INPUT_TYPE = 'INVALID_INPUT_TYPE',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INPUT_DOCUMENT_ERROR = 'INPUT_DOCUMENT_ERROR',
  GENERATOR_ERROR = 'GENERATOR_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
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
   */
  public format(): string {
    let output = `\n❌ ${this.message}`;

    if (this.details) {
      output += `\n\n📋 Details:\n${this.details}`;
    }

    if (this.help) {
      output += `\n\n💡 How to fix:\n${this.help}`;
    }

    return output;
  }
}

/**
 * Helper functions to create specific error types
 */

export function createConfigNotFoundError(
  filePath?: string,
  searchLocations?: string[]
): CodegenError {
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

export function createConfigParseError(
  filePath: string,
  originalError: Error
): CodegenError {
  return new CodegenError({
    type: ErrorType.CONFIG_PARSE_ERROR,
    message: `Failed to parse configuration file: ${filePath}`,
    details: originalError.message,
    help: `Check that your configuration file is valid JSON, YAML, or JavaScript.\nMake sure there are no syntax errors in the file.`
  });
}

export function createInvalidPresetError(
  preset: string,
  language: string
): CodegenError {
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

export function createInvalidInputTypeError(inputType: string): CodegenError {
  const validTypes = ['asyncapi', 'openapi', 'jsonschema'];
  const typeList = validTypes.map((t) => `  - ${t}`).join('\n');

  return new CodegenError({
    type: ErrorType.INVALID_INPUT_TYPE,
    message: `Invalid input type '${inputType}'`,
    details: `Valid input types are:\n${typeList}`,
    help: `Update your configuration to use a valid inputType.\nFor more information, visit: https://the-codegen-project.org/docs/category/inputs`
  });
}

export function createMissingRequiredFieldError(
  field: string,
  location?: string
): CodegenError {
  const locationSuffix = location ? ` at "${location}"` : '';
  return new CodegenError({
    type: ErrorType.MISSING_REQUIRED_FIELD,
    message: `Missing required field: ${field}${locationSuffix}`,
    help: `Add the required '${field}' field to your configuration file.\nFor more information, visit: https://the-codegen-project.org/docs/configurations/`
  });
}

export function createConfigValidationError(
  validationErrors: string[]
): CodegenError {
  return new CodegenError({
    type: ErrorType.CONFIG_VALIDATION_ERROR,
    message: 'Configuration validation failed',
    details: validationErrors.join('\n'),
    help: `Review and fix the validation errors in your configuration file.\nFor more information, visit: https://the-codegen-project.org/docs/configurations/`
  });
}

export function createInputDocumentError(
  inputPath: string,
  originalError: Error
): CodegenError {
  return new CodegenError({
    type: ErrorType.INPUT_DOCUMENT_ERROR,
    message: `Failed to load input document: ${inputPath}`,
    details: originalError.message,
    help: `Check that the input file exists and is a valid ${inputPath.endsWith('.json') ? 'JSON' : 'YAML'} file.\nEnsure the document conforms to the expected specification.`
  });
}

export function createGeneratorError(
  generatorId: string,
  originalError: Error
): CodegenError {
  return new CodegenError({
    type: ErrorType.GENERATOR_ERROR,
    message: `Generator '${generatorId}' failed`,
    details: originalError.message,
    help: `Check the generator configuration and input document.\nIf the issue persists, please report it at: https://github.com/the-codegen-project/cli/issues`
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

/**
 * Detect error type from error message and create appropriate CodegenError
 */
export function enhanceError(error: unknown): CodegenError {
  // Already a CodegenError
  if (error instanceof CodegenError) {
    return error;
  }

  // Convert to Error if needed
  const err = error instanceof Error ? error : new Error(String(error));

  // Detect error patterns and create appropriate CodegenError
  if (err.message.includes('Cannot find configuration')) {
    if (err.message.includes('at path:')) {
      const pathMatch = err.message.match(/at path: (.+)/);
      const filePath = pathMatch ? pathMatch[1] : undefined;
      return createConfigNotFoundError(filePath);
    }
    const searchLocations = [
      'codegen.json',
      'codegen.yaml',
      'codegen.yml',
      'codegen.js',
      'codegen.ts',
      'codegen.mjs',
      'codegen.cjs'
    ];
    return createConfigNotFoundError(undefined, searchLocations);
  }

  if (err.message.includes('Unable to determine default generator')) {
    return createInvalidPresetError('unknown', 'typescript');
  }

  if (err.message.includes('Invalid configuration file')) {
    // Try to extract validation details
    const details = err.message.split('Invalid configuration file; ')[1] || '';
    return new CodegenError({
      type: ErrorType.CONFIG_VALIDATION_ERROR,
      message: 'Configuration validation failed',
      details,
      help: `Review and fix the validation errors in your configuration file.\nFor more information, visit: https://the-codegen-project.org/docs/configurations/`
    });
  }

  // Default: wrap in generic error
  return new CodegenError({
    type: ErrorType.UNKNOWN_ERROR,
    message: err.message,
    details: err.stack,
    help: `If this error persists, please report it at: https://github.com/the-codegen-project/cli/issues`
  });
}
