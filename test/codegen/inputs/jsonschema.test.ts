import {loadJsonSchemaFromMemory, loadJsonSchemaDocument} from '../../../src/codegen/inputs/jsonschema';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('JSON Schema Input Processing', () => {
  test('should load valid JSON Schema from memory', () => {
    const schema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      },
      required: ['name']
    };

    const result = loadJsonSchemaFromMemory(schema);
    expect(result).toEqual(schema);
  });

  test('should throw error for invalid schema', () => {
    expect(() => {
      loadJsonSchemaFromMemory(null as any);
    }).toThrow('Invalid JSON Schema document from memory: Document must be an object');
  });

  test('should warn for empty schema but not throw', () => {
    const emptySchema = {};
    const result = loadJsonSchemaFromMemory(emptySchema);
    expect(result).toEqual(emptySchema);
  });

  test('should load JSON Schema from JSON file', async () => {
    const testSchemaPath = path.join(os.tmpdir(), 'test-schema.json');
    const testSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'User',
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      },
      required: ['id', 'name', 'email']
    };

    fs.writeFileSync(testSchemaPath, JSON.stringify(testSchema, null, 2));
    
    try {
      const result = await loadJsonSchemaDocument(testSchemaPath);
      expect(result).toEqual(testSchema);
    } finally {
      if (fs.existsSync(testSchemaPath)) {
        fs.unlinkSync(testSchemaPath);
      }
    }
  });

  test('should throw error for non-existent file', async () => {
    await expect(
      loadJsonSchemaDocument('/non/existent/file.json')
    ).rejects.toThrow('Failed to load JSON Schema document');
  });

  test('should throw error for unsupported file format', async () => {
    const txtPath = path.join(os.tmpdir(), 'test-schema.txt');
    fs.writeFileSync(txtPath, 'not a schema');
    
    try {
      await expect(
        loadJsonSchemaDocument(txtPath)
      ).rejects.toThrow('Unsupported file format for JSON Schema');
    } finally {
      if (fs.existsSync(txtPath)) {
        fs.unlinkSync(txtPath);
      }
    }
  });
});
