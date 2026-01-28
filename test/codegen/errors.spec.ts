import {
  CodegenError,
  ErrorType,
  createConfigNotFoundError,
  createConfigParseError,
  createInvalidPresetError,
  createInvalidInputTypeError,
  createMissingRequiredFieldError,
  createConfigValidationError,
  createInputDocumentError,
  createGeneratorError,
  createUnsupportedLanguageError,
  createMissingInputDocumentError,
  createMissingPayloadError,
  createMissingParameterError,
  createCircularDependencyError,
  createDuplicateGeneratorIdError,
  createUnsupportedPresetForInputError,
  parseZodErrors
} from '../../src/codegen/errors';
import {z} from 'zod';

describe('Error Handling', () => {
  describe('CodegenError', () => {
    it('should create error with all properties', () => {
      const error = new CodegenError({
        type: ErrorType.CONFIG_NOT_FOUND,
        message: 'Test error',
        help: 'Test help',
        details: 'Test details'
      });

      expect(error.type).toBe(ErrorType.CONFIG_NOT_FOUND);
      expect(error.message).toBe('Test error');
      expect(error.help).toBe('Test help');
      expect(error.details).toBe('Test details');
      expect(error.name).toBe('CodegenError');
    });

    it('should format error message for display', () => {
      const error = new CodegenError({
        type: ErrorType.CONFIG_NOT_FOUND,
        message: 'Test error',
        help: 'Test help',
        details: 'Test details'
      });

      const formatted = error.format();
      expect(formatted).toContain('Test error');
      expect(formatted).toContain('Details:');
      expect(formatted).toContain('Test details');
      expect(formatted).toContain('How to fix:');
      expect(formatted).toContain('Test help');
    });

    it('should format error without help or details', () => {
      const error = new CodegenError({
        type: ErrorType.CONFIG_NOT_FOUND,
        message: 'Test error'
      });

      const formatted = error.format();
      expect(formatted).toContain('Test error');
      expect(formatted).not.toContain('Details:');
      expect(formatted).not.toContain('How to fix:');
    });
  });

  describe('createConfigNotFoundError', () => {
    it('should create error for specific file path', () => {
      const error = createConfigNotFoundError({filePath: '/path/to/config.json'});

      expect(error.type).toBe(ErrorType.CONFIG_NOT_FOUND);
      expect(error.message).toContain('/path/to/config.json');
      expect(error.help).toContain('codegen init');
    });

    it('should create error with search locations', () => {
      const locations = ['codegen.json', 'codegen.yaml'];
      const error = createConfigNotFoundError({searchLocations: locations});

      expect(error.type).toBe(ErrorType.CONFIG_NOT_FOUND);
      expect(error.message).toContain('No configuration file found');
      expect(error.details).toContain('codegen.json');
      expect(error.details).toContain('codegen.yaml');
      expect(error.help).toContain('codegen init');
    });
  });

  describe('createConfigParseError', () => {
    it('should create parse error with details', () => {
      const originalError = new Error('Unexpected token');
      const error = createConfigParseError({filePath: '/path/to/config.js', originalError});

      expect(error.type).toBe(ErrorType.CONFIG_PARSE_ERROR);
      expect(error.message).toContain('/path/to/config.js');
      expect(error.details).toContain('Unexpected token');
      expect(error.help).toContain('syntax errors');
    });
  });

  describe('createInvalidPresetError', () => {
    it('should create error with valid presets list', () => {
      const error = createInvalidPresetError({preset: 'invalid-preset', language: 'typescript'});

      expect(error.type).toBe(ErrorType.INVALID_PRESET);
      expect(error.message).toContain('invalid-preset');
      expect(error.message).toContain('typescript');
      expect(error.details).toContain('payloads');
      expect(error.details).toContain('channels');
      expect(error.help).toContain('valid preset');
    });
  });

  describe('createInvalidInputTypeError', () => {
    it('should create error with valid input types', () => {
      const error = createInvalidInputTypeError({inputType: 'invalid-type'});

      expect(error.type).toBe(ErrorType.INVALID_INPUT_TYPE);
      expect(error.message).toContain('invalid-type');
      expect(error.details).toContain('asyncapi');
      expect(error.details).toContain('openapi');
      expect(error.details).toContain('jsonschema');
      expect(error.help).toContain('inputType');
    });
  });

  describe('createMissingRequiredFieldError', () => {
    it('should create error with field name', () => {
      const error = createMissingRequiredFieldError({field: 'inputPath'});

      expect(error.type).toBe(ErrorType.MISSING_REQUIRED_FIELD);
      expect(error.message).toContain('inputPath');
      expect(error.help).toContain('inputPath');
    });

    it('should create error with field name and location', () => {
      const error = createMissingRequiredFieldError({field: 'outputPath', location: 'generators[0]'});

      expect(error.type).toBe(ErrorType.MISSING_REQUIRED_FIELD);
      expect(error.message).toContain('outputPath');
      expect(error.message).toContain('generators[0]');
    });
  });

  describe('createConfigValidationError', () => {
    it('should create error with validation messages', () => {
      const errors = ['Error 1', 'Error 2', 'Error 3'];
      const error = createConfigValidationError({validationErrors: errors});

      expect(error.type).toBe(ErrorType.CONFIG_VALIDATION_ERROR);
      expect(error.message).toContain('validation failed');
      expect(error.details).toContain('Error 1');
      expect(error.details).toContain('Error 2');
      expect(error.details).toContain('Error 3');
    });
  });

  describe('createInputDocumentError', () => {
    it('should create error with document path', () => {
      const error = createInputDocumentError({
        inputPath: '/path/to/schema.yml',
        inputType: 'asyncapi',
        errorMessage: 'Invalid schema'
      });

      expect(error.type).toBe(ErrorType.INPUT_DOCUMENT_ERROR);
      expect(error.message).toContain('/path/to/schema.yml');
      expect(error.details).toContain('Invalid schema');
      expect(error.help).toContain('YAML');
    });
  });

  describe('createGeneratorError', () => {
    it('should create error with generator id', () => {
      const originalError = new Error('Generation failed');
      const error = createGeneratorError({generatorId: 'payloads-typescript', originalError});

      expect(error.type).toBe(ErrorType.GENERATOR_ERROR);
      expect(error.message).toContain('payloads-typescript');
      expect(error.details).toContain('Generation failed');
      expect(error.help).toContain('report it');
    });
  });

  describe('createUnsupportedLanguageError', () => {
    it('should create error with preset and language', () => {
      const error = createUnsupportedLanguageError({preset: 'channels', language: 'python'});

      expect(error.type).toBe(ErrorType.UNSUPPORTED_LANGUAGE);
      expect(error.message).toContain('python');
      expect(error.message).toContain('channels');
      expect(error.details).toContain('typescript');
      expect(error.help).toContain('language');
    });
  });

  describe('createMissingInputDocumentError', () => {
    it('should create error with expected type', () => {
      const error = createMissingInputDocumentError({expectedType: 'asyncapi'});

      expect(error.type).toBe(ErrorType.MISSING_INPUT_DOCUMENT);
      expect(error.message).toContain('asyncapi');
      expect(error.help).toContain('inputType');
      expect(error.help).toContain('inputPath');
    });

    it('should create error with generator preset context', () => {
      const error = createMissingInputDocumentError({expectedType: 'openapi', generatorPreset: 'payloads'});

      expect(error.type).toBe(ErrorType.MISSING_INPUT_DOCUMENT);
      expect(error.message).toContain('openapi');
      expect(error.message).toContain('payloads');
    });
  });

  describe('createMissingPayloadError', () => {
    it('should create error with channel name', () => {
      const error = createMissingPayloadError({channelOrOperation: 'user/signup'});

      expect(error.type).toBe(ErrorType.MISSING_PAYLOAD);
      expect(error.message).toContain('user/signup');
      expect(error.help).toContain('payloads');
    });

    it('should create error with protocol context', () => {
      const error = createMissingPayloadError({channelOrOperation: 'user/signup', protocol: 'NATS'});

      expect(error.type).toBe(ErrorType.MISSING_PAYLOAD);
      expect(error.message).toContain('user/signup');
      expect(error.message).toContain('NATS');
    });
  });

  describe('createMissingParameterError', () => {
    it('should create error with channel name', () => {
      const error = createMissingParameterError({channelOrOperation: 'orders/{orderId}'});

      expect(error.type).toBe(ErrorType.MISSING_PARAMETER);
      expect(error.message).toContain('orders/{orderId}');
      expect(error.help).toContain('parameters');
    });

    it('should create error with protocol context', () => {
      const error = createMissingParameterError({channelOrOperation: 'orders/{orderId}', protocol: 'Kafka'});

      expect(error.type).toBe(ErrorType.MISSING_PARAMETER);
      expect(error.message).toContain('orders/{orderId}');
      expect(error.message).toContain('Kafka');
    });
  });

  describe('createCircularDependencyError', () => {
    it('should create error without specific generator ids', () => {
      const error = createCircularDependencyError();

      expect(error.type).toBe(ErrorType.CIRCULAR_DEPENDENCY);
      expect(error.message).toContain('Circular dependency');
      expect(error.help).toContain('dependencies');
    });

    it('should create error with specific generator ids', () => {
      const error = createCircularDependencyError({generatorIds: ['gen-a', 'gen-b', 'gen-c']});

      expect(error.type).toBe(ErrorType.CIRCULAR_DEPENDENCY);
      expect(error.message).toContain('gen-a');
      expect(error.message).toContain('gen-b');
      expect(error.message).toContain('gen-c');
    });
  });

  describe('createDuplicateGeneratorIdError', () => {
    it('should create error with duplicate ids', () => {
      const error = createDuplicateGeneratorIdError({duplicateIds: ['payloads', 'models']});

      expect(error.type).toBe(ErrorType.DUPLICATE_GENERATOR_ID);
      expect(error.message).toContain('payloads');
      expect(error.message).toContain('models');
      expect(error.help).toContain('unique');
    });
  });

  describe('createUnsupportedPresetForInputError', () => {
    it('should create error with preset, input type, and supported presets', () => {
      const error = createUnsupportedPresetForInputError({
        preset: 'channels',
        inputType: 'jsonschema',
        supportedPresets: ['payloads', 'models', 'types']
      });

      expect(error.type).toBe(ErrorType.UNSUPPORTED_PRESET_FOR_INPUT);
      expect(error.message).toContain('channels');
      expect(error.message).toContain('jsonschema');
      expect(error.details).toContain('payloads');
      expect(error.details).toContain('models');
      expect(error.details).toContain('types');
      expect(error.help).toContain('supported preset');
    });
  });

  describe('parseZodErrors', () => {
    it('should parse actual Zod validation errors', () => {
      // Create a real Zod schema and get actual validation error
      const schema = z.object({
        inputType: z.enum(['asyncapi', 'openapi', 'jsonschema']),
        inputPath: z.string(),
        outputPath: z.string()
      });

      const result = schema.safeParse({
        inputType: 'invalid',
        inputPath: 123,
        outputPath: ''
      });

      // Verify that validation failed
      expect(result.success).toBe(false);

      // Type guard to ensure we have the error
      if (result.success) {
        throw new Error('Expected validation to fail');
      }

      const errors = parseZodErrors(result.error);

      // Should parse all validation errors
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('inputType'))).toBe(true);
      expect(errors.some(e => e.includes('inputPath'))).toBe(true);
    });

    it('should parse invalid union discriminator errors', () => {
      const zodError = {
        issues: [
          {
            code: 'invalid_union_discriminator',
            path: ['inputType'],
            message: 'Invalid discriminator value',
            options: ['asyncapi', 'openapi', 'jsonschema']
          }
        ]
      };

      const errors = parseZodErrors(zodError);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('inputType');
      expect(errors[0]).toContain('asyncapi');
      expect(errors[0]).toContain('openapi');
    });

    it('should parse invalid type errors', () => {
      const zodError = {
        issues: [
          {
            code: 'invalid_type',
            path: ['inputPath'],
            message: 'Expected string',
            expected: 'string',
            received: 'number'
          }
        ]
      };

      const errors = parseZodErrors(zodError);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('inputPath');
      expect(errors[0]).toContain('string');
      expect(errors[0]).toContain('number');
    });

    it('should parse invalid literal errors', () => {
      const zodError = {
        issues: [
          {
            code: 'invalid_literal',
            path: ['preset'],
            message: 'Invalid literal value',
            expected: 'payloads'
          }
        ]
      };

      const errors = parseZodErrors(zodError);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('preset');
      expect(errors[0]).toContain('payloads');
    });

    it('should parse generic errors', () => {
      const zodError = {
        issues: [
          {
            code: 'custom',
            path: ['custom', 'field'],
            message: 'Custom validation failed'
          }
        ]
      };

      const errors = parseZodErrors(zodError);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('custom.field');
      expect(errors[0]).toContain('Custom validation failed');
    });
  });
});
