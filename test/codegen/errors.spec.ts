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
  parseZodErrors,
  enhanceError
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
      expect(formatted).toContain('❌ Test error');
      expect(formatted).toContain('📋 Details:');
      expect(formatted).toContain('Test details');
      expect(formatted).toContain('💡 How to fix:');
      expect(formatted).toContain('Test help');
    });

    it('should format error without help or details', () => {
      const error = new CodegenError({
        type: ErrorType.CONFIG_NOT_FOUND,
        message: 'Test error'
      });

      const formatted = error.format();
      expect(formatted).toContain('❌ Test error');
      expect(formatted).not.toContain('📋 Details:');
      expect(formatted).not.toContain('💡 How to fix:');
    });
  });

  describe('createConfigNotFoundError', () => {
    it('should create error for specific file path', () => {
      const error = createConfigNotFoundError('/path/to/config.json');

      expect(error.type).toBe(ErrorType.CONFIG_NOT_FOUND);
      expect(error.message).toContain('/path/to/config.json');
      expect(error.help).toContain('codegen init');
    });

    it('should create error with search locations', () => {
      const locations = ['codegen.json', 'codegen.yaml'];
      const error = createConfigNotFoundError(undefined, locations);

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
      const error = createConfigParseError('/path/to/config.js', originalError);

      expect(error.type).toBe(ErrorType.CONFIG_PARSE_ERROR);
      expect(error.message).toContain('/path/to/config.js');
      expect(error.details).toContain('Unexpected token');
      expect(error.help).toContain('syntax errors');
    });
  });

  describe('createInvalidPresetError', () => {
    it('should create error with valid presets list', () => {
      const error = createInvalidPresetError('invalid-preset', 'typescript');

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
      const error = createInvalidInputTypeError('invalid-type');

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
      const error = createMissingRequiredFieldError('inputPath');

      expect(error.type).toBe(ErrorType.MISSING_REQUIRED_FIELD);
      expect(error.message).toContain('inputPath');
      expect(error.help).toContain('inputPath');
    });

    it('should create error with field name and location', () => {
      const error = createMissingRequiredFieldError('outputPath', 'generators[0]');

      expect(error.type).toBe(ErrorType.MISSING_REQUIRED_FIELD);
      expect(error.message).toContain('outputPath');
      expect(error.message).toContain('generators[0]');
    });
  });

  describe('createConfigValidationError', () => {
    it('should create error with validation messages', () => {
      const errors = ['Error 1', 'Error 2', 'Error 3'];
      const error = createConfigValidationError(errors);

      expect(error.type).toBe(ErrorType.CONFIG_VALIDATION_ERROR);
      expect(error.message).toContain('validation failed');
      expect(error.details).toContain('Error 1');
      expect(error.details).toContain('Error 2');
      expect(error.details).toContain('Error 3');
    });
  });

  describe('createInputDocumentError', () => {
    it('should create error with document path', () => {
      const originalError = new Error('Invalid schema');
      const error = createInputDocumentError('/path/to/schema.yml', originalError);

      expect(error.type).toBe(ErrorType.INPUT_DOCUMENT_ERROR);
      expect(error.message).toContain('/path/to/schema.yml');
      expect(error.details).toContain('Invalid schema');
      expect(error.help).toContain('YAML');
    });
  });

  describe('createGeneratorError', () => {
    it('should create error with generator id', () => {
      const originalError = new Error('Generation failed');
      const error = createGeneratorError('payloads-typescript', originalError);

      expect(error.type).toBe(ErrorType.GENERATOR_ERROR);
      expect(error.message).toContain('payloads-typescript');
      expect(error.details).toContain('Generation failed');
      expect(error.help).toContain('report it');
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

  describe('enhanceError', () => {
    it('should return CodegenError as-is', () => {
      const error = createConfigNotFoundError('/path/to/config.json');
      const enhanced = enhanceError(error);

      expect(enhanced).toBe(error);
    });

    it('should detect config not found errors', () => {
      const error = new Error('Cannot find configuration at path: /test/path');
      const enhanced = enhanceError(error);

      expect(enhanced.type).toBe(ErrorType.CONFIG_NOT_FOUND);
    });

    it('should detect config not found without path', () => {
      const error = new Error('Cannot find configuration file. Searched in...');
      const enhanced = enhanceError(error);

      expect(enhanced.type).toBe(ErrorType.CONFIG_NOT_FOUND);
    });

    it('should detect invalid preset errors', () => {
      const error = new Error('Unable to determine default generator');
      const enhanced = enhanceError(error);

      expect(enhanced.type).toBe(ErrorType.INVALID_PRESET);
    });

    it('should detect validation errors', () => {
      const error = new Error('Invalid configuration file; validation error details');
      const enhanced = enhanceError(error);

      expect(enhanced.type).toBe(ErrorType.CONFIG_VALIDATION_ERROR);
    });

    it('should wrap unknown errors', () => {
      const error = new Error('Some random error');
      const enhanced = enhanceError(error);

      expect(enhanced.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(enhanced.message).toContain('Some random error');
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const enhanced = enhanceError(error);

      expect(enhanced.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(enhanced.message).toBe('String error');
    });
  });
});

