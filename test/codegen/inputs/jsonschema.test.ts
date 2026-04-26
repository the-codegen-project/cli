import {loadJsonSchema, loadJsonSchemaFromMemory, loadJsonSchemaDocument} from '../../../src/codegen/inputs/jsonschema';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {RunGeneratorContext} from '../../../src/codegen/types';
import {startTestServer} from './__helpers__/httpServer';

const DRAFT_07 = 'http://json-schema.org/draft-07/schema#';
const CONFIG_FILE = 'codegen.json';

describe('JSON Schema Input Processing', () => {
  test('should load valid JSON Schema from memory', () => {
    const schema = {
      $schema: DRAFT_07,
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
    }).toThrow('Failed to load jsonschema document: memory');
  });

  test('should warn for empty schema but not throw', () => {
    const emptySchema = {};
    const result = loadJsonSchemaFromMemory(emptySchema);
    expect(result).toEqual(emptySchema);
  });

  test('should load JSON Schema from JSON file', async () => {
    const testSchemaPath = path.join(os.tmpdir(), 'test-schema.json');
    const testSchema = {
      $schema: DRAFT_07,
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
    ).rejects.toThrow('Failed to load jsonschema document');
  });

  test('should throw error for unsupported file format', async () => {
    const txtPath = path.join(os.tmpdir(), 'test-schema.txt');
    fs.writeFileSync(txtPath, 'not a schema');

    try {
      await expect(
        loadJsonSchemaDocument(txtPath)
      ).rejects.toThrow('Failed to load jsonschema document');
    } finally {
      if (fs.existsSync(txtPath)) {
        fs.unlinkSync(txtPath);
      }
    }
  });

  describe('remote URL loading', () => {
    test('loads JSON Schema from URL with JSON Content-Type', async () => {
      const schema = {
        $schema: DRAFT_07,
        type: 'object',
        properties: {id: {type: 'string'}}
      };
      const server = await startTestServer([
        {
          path: '/schema',
          body: JSON.stringify(schema),
          contentType: 'application/json'
        }
      ]);
      try {
        const context: RunGeneratorContext = {
          configuration: {
            inputType: 'jsonschema',
            inputPath: `${server.url}/schema`,
            generators: []
          },
          configFilePath: CONFIG_FILE,
          documentPath: `${server.url}/schema`
        };
        const result = await loadJsonSchema(context);
        expect(result).toEqual(schema);
      } finally {
        await server.close();
      }
    });

    test('sends bearer auth header', async () => {
      const schema = {
        $schema: DRAFT_07,
        type: 'object',
        properties: {a: {type: 'string'}}
      };
      const server = await startTestServer([
        {
          path: '/schema.json',
          body: JSON.stringify(schema),
          contentType: 'application/json',
          requireHeader: {name: 'authorization', value: 'Bearer abc'}
        }
      ]);
      try {
        const context: RunGeneratorContext = {
          configuration: {
            inputType: 'jsonschema',
            inputPath: `${server.url}/schema.json`,
            generators: []
          },
          configFilePath: CONFIG_FILE,
          documentPath: `${server.url}/schema.json`,
          inputAuth: {type: 'bearer', token: 'abc'}
        };
        const result = await loadJsonSchema(context);
        expect(result).toEqual(schema);
        expect(server.requests[0]!.headers['authorization']).toBe('Bearer abc');
      } finally {
        await server.close();
      }
    });

    test('loads YAML when Content-Type is yaml', async () => {
      const yaml = `$schema: '${DRAFT_07}'
type: object
properties:
  name:
    type: string
`;
      const server = await startTestServer([
        {
          path: '/schema',
          body: yaml,
          contentType: 'application/yaml'
        }
      ]);
      try {
        const context: RunGeneratorContext = {
          configuration: {
            inputType: 'jsonschema',
            inputPath: `${server.url}/schema`,
            generators: []
          },
          configFilePath: CONFIG_FILE,
          documentPath: `${server.url}/schema`
        };
        const result = await loadJsonSchema(context);
        expect(result.type).toBe('object');
      } finally {
        await server.close();
      }
    });

    test('falls back to JSON-then-YAML for ambiguous Content-Type', async () => {
      const yaml = `$schema: '${DRAFT_07}'
type: object
properties:
  name:
    type: string
`;
      const server = await startTestServer([
        {
          path: '/schema',
          body: yaml,
          contentType: 'text/plain'
        }
      ]);
      try {
        const context: RunGeneratorContext = {
          configuration: {
            inputType: 'jsonschema',
            inputPath: `${server.url}/schema`,
            generators: []
          },
          configFilePath: CONFIG_FILE,
          documentPath: `${server.url}/schema`
        };
        const result = await loadJsonSchema(context);
        expect(result.type).toBe('object');
      } finally {
        await server.close();
      }
    });
  });
});
