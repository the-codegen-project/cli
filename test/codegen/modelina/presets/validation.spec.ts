/**
 * Tests for validation preset Modelina integration.
 * Verifies ajv-formats import works without esModuleInterop and type-only imports are used.
 */
import {
  generateTypescriptValidationCode,
  createValidationPreset
} from '../../../../src/codegen/modelina/presets/validation';

// Mock the TypeScriptRenderer with a dependency manager
const createMockRenderer = () => {
  const dependencies: Array<{what: string; from: string}> = [];
  return {
    dependencies,
    dependencyManager: {
      addTypeScriptDependency: (what: string, from: string) => {
        dependencies.push({what, from});
      }
    }
  };
};

// Mock model for testing
const createMockModel = () => ({
  name: 'TestModel',
  originalInput: {
    type: 'object',
    properties: {
      name: {type: 'string'}
    }
  }
});

describe('Validation Preset', () => {
  describe('ajv-formats import', () => {
    it('should use named import with default alias for ajv-formats', () => {
      const mockRenderer = createMockRenderer();
      const mockModel = createMockModel();
      const context = {
        inputType: 'asyncapi' as const,
        generator: {includeValidation: true},
        dependencyOutputs: {}
      };

      generateTypescriptValidationCode({
        model: mockModel as any,
        renderer: mockRenderer as any,
        asClassMethods: true,
        context: context as any
      });

      // Find the ajv-formats dependency
      const ajvFormatsDep = mockRenderer.dependencies.find(
        (d) => d.from === 'ajv-formats'
      );
      expect(ajvFormatsDep).toBeDefined();
      // Should use named import pattern that works without esModuleInterop
      // Either: `{default as addFormats}` or `* as addFormatsModule`
      expect(ajvFormatsDep?.what).toMatch(
        /(\{default as addFormats\})|(\* as \w+)/
      );
    });

    it('should not use bare default import for ajv-formats', () => {
      const mockRenderer = createMockRenderer();
      const mockModel = createMockModel();
      const context = {
        inputType: 'asyncapi' as const,
        generator: {includeValidation: true},
        dependencyOutputs: {}
      };

      generateTypescriptValidationCode({
        model: mockModel as any,
        renderer: mockRenderer as any,
        asClassMethods: true,
        context: context as any
      });

      // Find the ajv-formats dependency
      const ajvFormatsDep = mockRenderer.dependencies.find(
        (d) => d.from === 'ajv-formats'
      );
      // Should NOT be a bare default import
      expect(ajvFormatsDep?.what).not.toBe('addFormats');
    });
  });

  describe('ajv imports', () => {
    it('should import Ajv value and types from ajv', () => {
      const mockRenderer = createMockRenderer();
      const mockModel = createMockModel();
      const context = {
        inputType: 'asyncapi' as const,
        generator: {includeValidation: true},
        dependencyOutputs: {}
      };

      generateTypescriptValidationCode({
        model: mockModel as any,
        renderer: mockRenderer as any,
        asClassMethods: true,
        context: context as any
      });

      // Find the ajv dependency
      const ajvDep = mockRenderer.dependencies.find((d) => d.from === 'ajv');
      expect(ajvDep).toBeDefined();
      // Should import Ajv, ValidateFunction (runtime values) and types
      expect(ajvDep?.what).toContain('Ajv');
      expect(ajvDep?.what).toContain('ValidateFunction');
    });
  });

  describe('createValidationPreset', () => {
    it('should return empty additional content when validation disabled', () => {
      const context = {
        inputType: 'asyncapi' as const,
        generator: {includeValidation: false},
        dependencyOutputs: {}
      };

      const preset = createValidationPreset(
        {includeValidation: false},
        context
      );

      const mockRenderer = createMockRenderer();
      const mockModel = createMockModel();

      const result = preset.class.additionalContent({
        content: 'original content',
        model: mockModel as any,
        renderer: mockRenderer as any
      });

      expect(result).toBe('original content');
    });

    it('should add validation code when validation enabled', () => {
      const context = {
        inputType: 'asyncapi' as const,
        generator: {includeValidation: true},
        dependencyOutputs: {}
      };

      const preset = createValidationPreset({includeValidation: true}, context);

      const mockRenderer = createMockRenderer();
      const mockModel = createMockModel();

      const result = preset.class.additionalContent({
        content: 'original content',
        model: mockModel as any,
        renderer: mockRenderer as any
      });

      expect(result).toContain('original content');
      expect(result).toContain('validate');
      expect(result).toContain('createValidator');
    });
  });

  describe('generated validation code', () => {
    it('should generate validate and createValidator methods', () => {
      const mockRenderer = createMockRenderer();
      const mockModel = createMockModel();
      const context = {
        inputType: 'asyncapi' as const,
        generator: {includeValidation: true},
        dependencyOutputs: {}
      };

      const code = generateTypescriptValidationCode({
        model: mockModel as any,
        renderer: mockRenderer as any,
        asClassMethods: true,
        context: context as any
      });

      expect(code).toContain('validate');
      expect(code).toContain('createValidator');
      expect(code).toContain('addFormats');
    });

    it('should generate standalone functions when asClassMethods is false', () => {
      const mockRenderer = createMockRenderer();
      const mockModel = createMockModel();
      const context = {
        inputType: 'asyncapi' as const,
        generator: {includeValidation: true},
        dependencyOutputs: {}
      };

      const code = generateTypescriptValidationCode({
        model: mockModel as any,
        renderer: mockRenderer as any,
        asClassMethods: false,
        context: context as any
      });

      expect(code).toContain('export function validate');
      expect(code).toContain('export function createValidator');
    });

    it('should add openapi vocabulary when inputType is openapi', () => {
      const mockRenderer = createMockRenderer();
      const mockModel = createMockModel();
      const context = {
        inputType: 'openapi' as const,
        generator: {includeValidation: true},
        dependencyOutputs: {}
      };

      const code = generateTypescriptValidationCode({
        model: mockModel as any,
        renderer: mockRenderer as any,
        asClassMethods: true,
        context: context as any
      });

      expect(code).toContain('addVocabulary');
      expect(code).toContain('xml');
      expect(code).toContain('example');
    });
  });
});
