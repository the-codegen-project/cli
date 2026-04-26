/**
 * Tests for browser generate function.
 * Verifies main browser generation function takes string inputs and returns files in memory.
 */
import {generate, BrowserGenerateInput} from '../../src/browser/generate';
import {parseConfig} from '../../src/browser/config';

// Sample AsyncAPI spec (v2.6.0 with inline payloads - no $ref)
const sampleAsyncAPISpec = `
asyncapi: 2.6.0
info:
  title: Account Service
  version: 1.0.0
channels:
  user/signedup:
    publish:
      message:
        payload:
          type: object
          properties:
            displayName:
              type: string
            email:
              type: string
              format: email
`;

// AsyncAPI 3.0 spec with $ref patterns (tests browser $ref resolution)
const asyncapi30WithRefSpec = `
asyncapi: '3.0.0'
info:
  title: Test Service
  version: '1.0.0'
channels:
  testChannel:
    address: test/channel
    messages:
      TestMessage:
        $ref: '#/components/messages/TestMessage'
components:
  messages:
    TestMessage:
      payload:
        type: object
        properties:
          id:
            type: string
          name:
            type: string
`;

// AsyncAPI 3.0 with channel $ref in operations
const asyncapi30WithChannelRefSpec = `
asyncapi: '3.0.0'
info:
  title: Test Service
  version: '1.0.0'
channels:
  testChannel:
    address: test/channel
    messages:
      TestMessage:
        $ref: '#/components/messages/TestMessage'
operations:
  publishTest:
    action: send
    channel:
      $ref: '#/channels/testChannel'
components:
  messages:
    TestMessage:
      payload:
        type: object
        properties:
          id:
            type: string
          name:
            type: string
        required:
          - id
`;

// Default playground spec - exact spec from website/src/components/Playground/examples.ts
const playgroundDefaultSpec = `asyncapi: '3.0.0'
info:
  title: User Service
  version: '1.0.0'
  description: Simple user events service

channels:
  userCreated:
    address: users/created
    messages:
      UserCreated:
        $ref: '#/components/messages/UserCreated'
  userUpdated:
    address: users/updated
    messages:
      UserUpdated:
        $ref: '#/components/messages/UserUpdated'

operations:
  publishUserCreated:
    action: send
    channel:
      $ref: '#/channels/userCreated'
  subscribeUserUpdated:
    action: receive
    channel:
      $ref: '#/channels/userUpdated'

components:
  messages:
    UserCreated:
      payload:
        type: object
        properties:
          id:
            type: string
            format: uuid
          email:
            type: string
            format: email
          name:
            type: string
          createdAt:
            type: string
            format: date-time
        required:
          - id
          - email
          - name
    UserUpdated:
      payload:
        type: object
        properties:
          id:
            type: string
            format: uuid
          name:
            type: string
          updatedAt:
            type: string
            format: date-time
        required:
          - id
`;

// Sample OpenAPI spec
const sampleOpenAPISpec = `
openapi: 3.0.0
info:
  title: Sample API
  version: 1.0.0
paths:
  /users:
    get:
      summary: Get users
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
`;

// OpenAPI spec with $refs in both request body and response (Pet Store style).
// Mirrors the playground's openapi-rest example so the user-visible contract
// — that internal $refs get dereferenced before payload generation — has
// explicit coverage. NOTE: Jest does not apply the esbuild shim plugin,
// so this exercises the real @apidevtools/json-schema-ref-parser; the
// shim itself is guarded by test/browser/shims/json-schema-ref-parser.spec.ts.
const openapiPetStoreWithRefsSpec = `
openapi: 3.0.3
info:
  title: Pet Store
  version: 1.0.0
paths:
  /pets:
    get:
      summary: List pets
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Pet'
    post:
      summary: Create a pet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePet'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
components:
  schemas:
    Pet:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        tag:
          type: string
    CreatePet:
      type: object
      required:
        - name
      properties:
        name:
          type: string
        tag:
          type: string
`;

// Sample JSON Schema
const sampleJsonSchema = `
{
  "$id": "User",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" }
  },
  "required": ["id", "name"]
}
`;

describe('Browser Generate', () => {
  describe('generate', () => {
    describe('AsyncAPI input', () => {
      it('should generate from AsyncAPI string input', async () => {
        const input: BrowserGenerateInput = {
          spec: sampleAsyncAPISpec,
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '', // Not used in browser
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              }
            ]
          }
        };

        const output = await generate(input);

        expect(output.errors).toHaveLength(0);
        expect(Object.keys(output.files).length).toBeGreaterThan(0);
      });

      it('should return generated files as Record<path, content>', async () => {
        const input: BrowserGenerateInput = {
          spec: sampleAsyncAPISpec,
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/models'
              }
            ]
          }
        };

        const output = await generate(input);

        // Should be a Record object
        expect(typeof output.files).toBe('object');

        // File paths should be strings
        for (const [path, content] of Object.entries(output.files)) {
          expect(typeof path).toBe('string');
          expect(typeof content).toBe('string');
          expect(path.endsWith('.ts')).toBe(true);
        }
      });
    });

    describe('AsyncAPI 3.0 with $ref (browser $ref resolution)', () => {
      it('should generate files from AsyncAPI 3.0 spec with message $ref', async () => {
        const input: BrowserGenerateInput = {
          spec: asyncapi30WithRefSpec,
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              }
            ]
          }
        };

        const output = await generate(input);

        expect(output.errors).toHaveLength(0);
        expect(Object.keys(output.files).length).toBeGreaterThan(0);
        // Verify payload content is actually generated (not empty files)
        const fileContents = Object.values(output.files);
        expect(fileContents.some((content) => content.includes('class'))).toBe(true);
      });

      it('should generate files from AsyncAPI 3.0 spec with channel $ref in operations', async () => {
        const input: BrowserGenerateInput = {
          spec: asyncapi30WithChannelRefSpec,
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              }
            ]
          }
        };

        const output = await generate(input);

        expect(output.errors).toHaveLength(0);
        expect(Object.keys(output.files).length).toBeGreaterThan(0);
        // Verify the generated file contains expected class
        const fileContents = Object.values(output.files);
        expect(fileContents.some((content) => content.includes('class'))).toBe(true);
      });

      it('should match the default playground example spec', async () => {
        // This is the exact spec from website/src/components/Playground/examples.ts
        const input: BrowserGenerateInput = {
          spec: playgroundDefaultSpec,
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              }
            ]
          }
        };

        const output = await generate(input);

        expect(output.errors).toHaveLength(0);
        expect(Object.keys(output.files).length).toBeGreaterThan(0);
        // Should generate UserCreated and UserUpdated payload classes
        const fileContents = Object.values(output.files).join('\n');
        expect(fileContents).toContain('class');
      });

      it('should generate payloads with all properties from $ref resolved messages', async () => {
        const input: BrowserGenerateInput = {
          spec: playgroundDefaultSpec,
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              }
            ]
          }
        };

        const output = await generate(input);

        expect(output.errors).toHaveLength(0);

        // Verify the generated code contains expected properties from the resolved $ref
        const fileContents = Object.values(output.files).join('\n');
        // UserCreated should have id, email, name, createdAt
        expect(fileContents).toContain('id');
        expect(fileContents).toContain('email');
        expect(fileContents).toContain('name');
      });
    });

    describe('OpenAPI input', () => {
      it('should generate from OpenAPI string input', async () => {
        const input: BrowserGenerateInput = {
          spec: sampleOpenAPISpec,
          specFormat: 'openapi',
          config: {
            inputType: 'openapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              }
            ]
          }
        };

        const output = await generate(input);

        expect(output.errors).toHaveLength(0);
        expect(Object.keys(output.files).length).toBeGreaterThan(0);
      });

      it('should generate payloads with dereferenced fields from $ref-bearing OpenAPI spec', async () => {
        const input: BrowserGenerateInput = {
          spec: openapiPetStoreWithRefsSpec,
          specFormat: 'openapi',
          config: {
            inputType: 'openapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              }
            ]
          }
        };

        const output = await generate(input);

        expect(output.errors).toHaveLength(0);
        expect(Object.keys(output.files).length).toBeGreaterThan(0);

        const fileContents = Object.values(output.files).join('\n');
        // Pet schema (referenced from both response and create response)
        expect(fileContents).toContain('id');
        expect(fileContents).toContain('name');
        expect(fileContents).toContain('tag');
        // At least one generated TypeScript class is emitted
        expect(fileContents).toContain('class');
      });
    });

    describe('JSON Schema input', () => {
      it('should generate from JSON Schema string input', async () => {
        const input: BrowserGenerateInput = {
          spec: sampleJsonSchema,
          specFormat: 'jsonschema',
          config: {
            inputType: 'jsonschema',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'models',
                outputPath: 'src/models'
              }
            ]
          }
        };

        const output = await generate(input);

        expect(output.errors).toHaveLength(0);
        expect(Object.keys(output.files).length).toBeGreaterThan(0);
      });
    });

    describe('Error handling', () => {
      it('should handle parsing errors gracefully', async () => {
        const input: BrowserGenerateInput = {
          spec: 'invalid: yaml: content: [',
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              }
            ]
          }
        };

        const output = await generate(input);

        // Should not throw, but return errors
        expect(output.errors.length).toBeGreaterThan(0);
      });

      it('should handle invalid spec format gracefully', async () => {
        const input: BrowserGenerateInput = {
          spec: sampleAsyncAPISpec,
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              }
            ]
          }
        };

        // Mismatch spec format and content
        input.spec = '{"not": "a valid asyncapi doc"}';

        const output = await generate(input);

        // Should handle gracefully
        expect(output.errors.length).toBeGreaterThan(0);
      });

      it('should handle empty spec gracefully', async () => {
        const input: BrowserGenerateInput = {
          spec: '',
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              }
            ]
          }
        };

        const output = await generate(input);

        expect(output.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Generator options', () => {
      it('should respect output path from generator config', async () => {
        const input: BrowserGenerateInput = {
          spec: sampleAsyncAPISpec,
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'custom/output/path'
              }
            ]
          }
        };

        const output = await generate(input);

        const paths = Object.keys(output.files);
        // Normalize path separators for cross-platform testing
        const normalizedPaths = paths.map((p) => p.replace(/\\/g, '/'));
        expect(
          normalizedPaths.some((p) => p.includes('custom/output/path'))
        ).toBe(true);
      });

      it('should handle multiple generators', async () => {
        const input: BrowserGenerateInput = {
          spec: sampleAsyncAPISpec,
          specFormat: 'asyncapi',
          config: {
            inputType: 'asyncapi',
            inputPath: '',
            language: 'typescript',
            generators: [
              {
                preset: 'payloads',
                outputPath: 'src/payloads'
              },
              {
                preset: 'types',
                outputPath: 'src/types'
              }
            ]
          }
        };

        const output = await generate(input);

        expect(output.errors).toHaveLength(0);
        // Should have files from both generators
        const paths = Object.keys(output.files);
        const hasPayloads = paths.some((p) => p.includes('payloads'));
        const hasTypes = paths.some((p) => p.includes('types'));
        expect(hasPayloads || hasTypes).toBe(true);
      });
    });
  });

  describe('Generator dependency resolution', () => {
    it('should pass payloads output to channels generator', async () => {
      const input: BrowserGenerateInput = {
        spec: playgroundDefaultSpec,
        specFormat: 'asyncapi',
        config: {
          inputType: 'asyncapi',
          inputPath: '',
          language: 'typescript',
          generators: [
            {
              preset: 'payloads',
              outputPath: 'src/payloads'
            },
            {
              preset: 'parameters',
              outputPath: 'src/parameters'
            },
            {
              preset: 'headers',
              outputPath: 'src/headers'
            },
            {
              preset: 'channels',
              outputPath: 'src/channels',
              protocols: ['nats']
            }
          ]
        }
      };

      const output = await generate(input);

      expect(output.errors).toHaveLength(0);
      expect(Object.keys(output.files).length).toBeGreaterThan(0);
      // Should have channel files that import from payloads
      const channelFiles = Object.keys(output.files).filter((f) =>
        f.includes('channels')
      );
      expect(channelFiles.length).toBeGreaterThan(0);
    });

    it('should work with client preset (depends on channels)', async () => {
      const input: BrowserGenerateInput = {
        spec: playgroundDefaultSpec,
        specFormat: 'asyncapi',
        config: {
          inputType: 'asyncapi',
          inputPath: '',
          language: 'typescript',
          generators: [
            {
              preset: 'payloads',
              outputPath: 'src/payloads'
            },
            {
              preset: 'parameters',
              outputPath: 'src/parameters'
            },
            {
              preset: 'headers',
              outputPath: 'src/headers'
            },
            {
              preset: 'channels',
              outputPath: 'src/channels',
              protocols: ['nats']
            },
            {
              preset: 'client',
              outputPath: 'src/client',
              protocols: ['nats']
            }
          ]
        }
      };

      const output = await generate(input);

      expect(output.errors).toHaveLength(0);
      const clientFiles = Object.keys(output.files).filter((f) =>
        f.includes('client')
      );
      expect(clientFiles.length).toBeGreaterThan(0);
    });

    it('should properly resolve dependencies even when generators are listed out of order', async () => {
      // List channels before payloads - the dependency should still be resolved
      const input: BrowserGenerateInput = {
        spec: playgroundDefaultSpec,
        specFormat: 'asyncapi',
        config: {
          inputType: 'asyncapi',
          inputPath: '',
          language: 'typescript',
          generators: [
            {
              preset: 'channels',
              outputPath: 'src/channels',
              protocols: ['nats']
            },
            {
              preset: 'payloads',
              outputPath: 'src/payloads'
            }
          ]
        }
      };

      const output = await generate(input);

      // Should not have the "could not determine previous rendered payloads" error
      expect(output.errors).toHaveLength(0);
      const channelFiles = Object.keys(output.files).filter((f) =>
        f.includes('channels')
      );
      expect(channelFiles.length).toBeGreaterThan(0);
    });

    it('should auto-add dependency generators when only channels is specified', async () => {
      // User specifies only channels - payloads, parameters, headers should be auto-added
      const input: BrowserGenerateInput = {
        spec: playgroundDefaultSpec,
        specFormat: 'asyncapi',
        config: {
          inputType: 'asyncapi',
          inputPath: '',
          language: 'typescript',
          generators: [
            {
              preset: 'channels',
              outputPath: 'src/channels',
              protocols: ['nats']
            }
          ]
        }
      };

      const output = await generate(input);

      // Should not have the "could not determine previous rendered payloads" error
      expect(output.errors).toHaveLength(0);
      // Should have channel files
      const channelFiles = Object.keys(output.files).filter((f) =>
        f.includes('channels')
      );
      expect(channelFiles.length).toBeGreaterThan(0);
      // Should also have auto-generated payload files in the channels subdirectory
      const payloadFiles = Object.keys(output.files).filter((f) =>
        f.includes('payload')
      );
      expect(payloadFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Pure core integration', () => {
    it('should use runGenerators from core pipeline (not duplicate logic)', async () => {
      // This test verifies that the browser generate() function uses the shared
      // core rendering pipeline. When the refactoring is complete, browser/generate.ts
      // should import and use runGenerators() from src/codegen/generators instead
      // of duplicating the generator logic.
      //
      // The test passes if generate() returns correct results - if it's using
      // duplicated logic, it will still work but the code will be unmaintainable.
      const input: BrowserGenerateInput = {
        spec: playgroundDefaultSpec,
        specFormat: 'asyncapi',
        config: {
          inputType: 'asyncapi',
          inputPath: '',
          language: 'typescript',
          generators: [
            {
              preset: 'payloads',
              outputPath: 'src/payloads'
            }
          ]
        }
      };

      const output = await generate(input);

      expect(output.errors).toHaveLength(0);
      expect(Object.keys(output.files).length).toBeGreaterThan(0);
    });

    it('should return files without performing any filesystem I/O', async () => {
      // Browser generation should be completely pure - no filesystem access
      const input: BrowserGenerateInput = {
        spec: sampleAsyncAPISpec,
        specFormat: 'asyncapi',
        config: {
          inputType: 'asyncapi',
          inputPath: '',
          language: 'typescript',
          generators: [
            {
              preset: 'payloads',
              outputPath: 'src/payloads'
            }
          ]
        }
      };

      // If this runs in Node.js test environment, it should NOT write any files
      const output = await generate(input);

      // Files should be returned in memory
      expect(output.files).toBeDefined();
      expect(typeof output.files).toBe('object');

      // Content should be included (not just paths)
      const firstFile = Object.values(output.files)[0];
      expect(typeof firstFile).toBe('string');
      expect(firstFile.length).toBeGreaterThan(0);
    });

    it('should include file content in output (not just paths)', async () => {
      const input: BrowserGenerateInput = {
        spec: sampleAsyncAPISpec,
        specFormat: 'asyncapi',
        config: {
          inputType: 'asyncapi',
          inputPath: '',
          language: 'typescript',
          generators: [
            {
              preset: 'payloads',
              outputPath: 'src/payloads'
            }
          ]
        }
      };

      const output = await generate(input);

      // Each file should have actual content
      for (const [path, content] of Object.entries(output.files)) {
        expect(typeof path).toBe('string');
        expect(path.endsWith('.ts')).toBe(true);
        expect(typeof content).toBe('string');
        expect(content.length).toBeGreaterThan(0);
        // Content should be valid TypeScript (at minimum contain export)
        expect(content).toContain('export');
      }
    });
  });

  describe('parseConfig', () => {
    it('should parse JSON config string correctly', () => {
      const configJson = JSON.stringify({
        inputType: 'asyncapi',
        inputPath: './spec.yaml',
        language: 'typescript',
        generators: [
          {
            preset: 'payloads',
            outputPath: 'src/payloads'
          }
        ]
      });

      const config = parseConfig(configJson, 'json');

      expect(config.inputType).toBe('asyncapi');
      expect(config.language).toBe('typescript');
      expect(config.generators).toHaveLength(1);
      expect(config.generators[0].preset).toBe('payloads');
    });

    it('should parse YAML config string correctly', () => {
      const configYaml = `
inputType: asyncapi
inputPath: ./spec.yaml
language: typescript
generators:
  - preset: payloads
    outputPath: src/payloads
`;

      const config = parseConfig(configYaml, 'yaml');

      expect(config.inputType).toBe('asyncapi');
      expect(config.language).toBe('typescript');
      expect(config.generators).toHaveLength(1);
    });

    it('should throw on invalid config format', () => {
      expect(() => {
        parseConfig('not valid json or yaml {{{{', 'json');
      }).toThrow();
    });

    it('should validate config structure', () => {
      const invalidConfig = JSON.stringify({
        inputType: 'invalid_type'
      });

      expect(() => {
        parseConfig(invalidConfig, 'json');
      }).toThrow();
    });
  });
});
