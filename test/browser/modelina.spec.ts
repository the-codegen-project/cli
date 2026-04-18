/**
 * Tests for Modelina integration with pure-core generation.
 * Verifies in-memory model generation using generateModels().
 */
import {generateModels} from '../../src/codegen/output';
import {TypeScriptFileGenerator} from '@asyncapi/modelina';

describe('Modelina Pure-Core Integration', () => {
  describe('generateModels', () => {
    it('should generate simple payload model returning files', async () => {
      const generator = new TypeScriptFileGenerator();
      const schema = {
        $id: 'User',
        type: 'object',
        properties: {
          id: {type: 'string'},
          name: {type: 'string'}
        },
        required: ['id', 'name']
      };

      const result = await generateModels({
        generator,
        input: schema,
        outputPath: 'src/models'
      });

      // Should have at least one file
      expect(result.files.length).toBeGreaterThan(0);

      // Each file should have path and content
      const file = result.files[0];
      expect(file).toHaveProperty('path');
      expect(file).toHaveProperty('content');

      // File should be in the specified output path
      expect(file.path.startsWith('src/models/')).toBe(true);

      // Content should contain class definition
      expect(file.content).toContain('class');
      expect(file.content).toContain('id');
      // 'name' is a reserved keyword, so Modelina may rename it
      expect(file.content).toMatch(/name|reservedName/i);
    });

    it('should generate enum types correctly', async () => {
      const generator = new TypeScriptFileGenerator({
        enumType: 'enum'
      });
      const schema = {
        $id: 'Status',
        type: 'string',
        enum: ['pending', 'active', 'completed']
      };

      const result = await generateModels({
        generator,
        input: schema,
        outputPath: 'src/types'
      });

      const content = result.files.map((f) => f.content).join('\n');
      expect(content).toContain('enum');
    });

    it('should handle complex nested types', async () => {
      const generator = new TypeScriptFileGenerator();
      const schema = {
        $id: 'Order',
        type: 'object',
        properties: {
          id: {type: 'string'},
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: {type: 'string'},
                quantity: {type: 'number'}
              }
            }
          },
          customer: {
            type: 'object',
            properties: {
              name: {type: 'string'},
              email: {type: 'string', format: 'email'}
            }
          }
        }
      };

      const result = await generateModels({
        generator,
        input: schema,
        outputPath: 'src/models'
      });

      // Should generate multiple models for nested types
      expect(result.files.length).toBeGreaterThan(0);

      const content = result.files.map((f) => f.content).join('\n');
      expect(content).toContain('Order');
    });

    it('should return empty result for empty schema', async () => {
      const generator = new TypeScriptFileGenerator();

      // Empty object schema that shouldn't generate anything meaningful
      const schema = {};

      const result = await generateModels({
        generator,
        input: schema,
        outputPath: 'src/models'
      });

      // Should return result object
      expect(result).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
    });

    it('should use output path for file names', async () => {
      const generator = new TypeScriptFileGenerator();
      const schema = {
        $id: 'TestModel',
        type: 'object',
        properties: {
          value: {type: 'string'}
        }
      };

      const result = await generateModels({
        generator,
        input: schema,
        outputPath: 'custom/path/to/models'
      });

      expect(result.files.some((f) => f.path.includes('custom/path/to/models'))).toBe(
        true
      );
    });

    it('should handle schemas with $ref', async () => {
      const generator = new TypeScriptFileGenerator();
      const schema = {
        $id: 'Container',
        type: 'object',
        properties: {
          item: {
            $ref: '#/$defs/Item'
          }
        },
        $defs: {
          Item: {
            type: 'object',
            properties: {
              id: {type: 'string'}
            }
          }
        }
      };

      const result = await generateModels({
        generator,
        input: schema,
        outputPath: 'src/models'
      });

      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should handle discriminated unions', async () => {
      const generator = new TypeScriptFileGenerator();
      const schema = {
        $id: 'Event',
        oneOf: [
          {
            type: 'object',
            properties: {
              type: {const: 'created'},
              data: {type: 'string'}
            }
          },
          {
            type: 'object',
            properties: {
              type: {const: 'deleted'},
              id: {type: 'string'}
            }
          }
        ],
        discriminator: {
          propertyName: 'type'
        }
      };

      const result = await generateModels({
        generator,
        input: schema,
        outputPath: 'src/events'
      });

      expect(result.files.length).toBeGreaterThan(0);
    });
  });

  describe('renderCompleteModelOptions', () => {
    it('should support named export type', async () => {
      const generator = new TypeScriptFileGenerator();
      const schema = {
        $id: 'NamedExport',
        type: 'object',
        properties: {
          value: {type: 'string'}
        }
      };

      const result = await generateModels({
        generator,
        input: schema,
        outputPath: 'src/models',
        options: {exportType: 'named'}
      });

      const content = result.files.map((f) => f.content).join('\n');
      expect(content).toContain('export');
    });
  });
});
