/**
 * End-to-end channels generation for the `http_server` protocol: protocol
 * dispatch, coexistence with `http_client`, the `organization` groupings and
 * import extensions.
 */
import path from 'node:path';
import {
  defaultTypeScriptChannelsGenerator,
  generateTypeScriptChannels
} from '../../../../../src/codegen/generators';
import {loadOpenapiFromMemory} from '../../../../../src/codegen/inputs/openapi';
import {loadAsyncapiDocument} from '../../../../../src/codegen/inputs/asyncapi';
import {generateTypescriptPayload} from '../../../../../src/codegen/generators/typescript/payloads';
import {generateTypescriptParameters} from '../../../../../src/codegen/generators/typescript/parameters';
import {generateTypescriptHeaders} from '../../../../../src/codegen/generators/typescript/headers';
import {TypeScriptChannelRenderType} from '../../../../../src/codegen/generators/typescript/channels/types';

const outputPath = path.resolve(__dirname, './output-http-server');

const petSchema = {
  type: 'object',
  required: ['name'],
  properties: {id: {type: 'integer'}, name: {type: 'string'}}
};

const spec = JSON.stringify({
  openapi: '3.0.3',
  info: {title: 'Petstore', version: '1.0.0'},
  servers: [{url: 'https://api.petstore.example/v1'}],
  paths: {
    '/pet': {
      post: {
        operationId: 'addPet',
        tags: ['pet'],
        description: 'Add a new pet to the store',
        requestBody: {
          content: {'application/json': {schema: petSchema}}
        },
        responses: {
          200: {
            description: 'OK',
            content: {'application/json': {schema: petSchema}}
          },
          405: {description: 'Invalid input'}
        }
      }
    },
    '/pet/{petId}': {
      get: {
        operationId: 'getPetById',
        tags: ['pet'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            schema: {type: 'integer'}
          },
          {name: 'X-Request-ID', in: 'header', schema: {type: 'string'}}
        ],
        responses: {
          200: {
            description: 'OK',
            content: {'application/json': {schema: petSchema}}
          },
          404: {description: 'Not found'}
        }
      }
    }
  }
});

async function generateChannels({
  protocols,
  organization = 'flat',
  importExtension
}: {
  protocols: string[];
  organization?: 'flat' | 'tag' | 'path';
  importExtension?: '.js' | '.ts' | 'none';
}): Promise<TypeScriptChannelRenderType> {
  const openapiDocument = await loadOpenapiFromMemory({specString: spec});
  const context = {
    inputType: 'openapi' as const,
    openapiDocument,
    dependencyOutputs: {}
  };
  const payloads = await generateTypescriptPayload({
    ...context,
    generator: {
      id: 'payloads-typescript',
      preset: 'payloads',
      outputPath: `${outputPath}/payloads`,
      language: 'typescript',
      dependencies: [],
      serializationType: 'json',
      includeValidation: true,
      useForJavaScript: true,
      rawPropertyNames: false,
      map: 'map',
      enum: 'union'
    }
  } as any);
  const parameters = await generateTypescriptParameters({
    ...context,
    generator: {
      id: 'parameters-typescript',
      preset: 'parameters',
      outputPath: `${outputPath}/parameters`,
      language: 'typescript',
      dependencies: []
    }
  } as any);
  const headers = await generateTypescriptHeaders({
    ...context,
    generator: {
      id: 'headers-typescript',
      preset: 'headers',
      outputPath: `${outputPath}/headers`,
      language: 'typescript',
      dependencies: [],
      serializationType: 'json',
      includeValidation: true
    }
  } as any);

  return generateTypeScriptChannels({
    generator: {
      ...defaultTypeScriptChannelsGenerator,
      outputPath: `${outputPath}/channels`,
      id: 'test',
      organization,
      ...(importExtension ? {importExtension} : {}),
      protocols
    },
    inputType: 'openapi',
    openapiDocument,
    dependencyOutputs: {
      'parameters-typescript': parameters,
      'payloads-typescript': payloads,
      'headers-typescript': headers
    }
  } as any);
}

describe('OpenAPI http_server channels', () => {
  it('generates one register function per operation with the common types once', async () => {
    const generated = await generateChannels({protocols: ['http_server']});

    const file = generated.protocolFiles['http_server'];
    expect(file).toBeDefined();
    expect(generated.protocolFiles['http_client']).toBeUndefined();

    // The shared block is emitted exactly once.
    expect(
      file.split('// Common Types - Shared across all HTTP server functions')
        .length - 1
    ).toEqual(1);
    expect(file).toContain('function registerAddPet(');
    expect(file).toContain('function registerGetPetById(');
    expect(file).toContain('export { registerAddPet, registerGetPetById };');
    expect(file).toMatchSnapshot('http_server-protocol-code');
  });

  it('lets the client and server protocols coexist in one generation', async () => {
    const generated = await generateChannels({
      protocols: ['http_client', 'http_server']
    });

    expect(generated.protocolFiles['http_client']).toBeDefined();
    expect(generated.protocolFiles['http_server']).toBeDefined();
    // Each file carries its own copy of the shared block, including HttpError.
    expect(generated.protocolFiles['http_client']).toContain(
      'export class HttpError extends HttpGlobalError'
    );
    expect(generated.protocolFiles['http_server']).toContain(
      'export class HttpError extends HttpGlobalError'
    );
    expect(generated.renderedFunctions['http_client']).toBeDefined();
    expect(generated.renderedFunctions['http_server']).toBeDefined();
  });

  it('registers an operation whose responses are all bodyless', async () => {
    const bodylessSpec = JSON.stringify({
      openapi: '3.0.3',
      info: {title: 'Bodyless', version: '1.0.0'},
      paths: {
        '/thing': {
          delete: {
            operationId: 'deleteThing',
            responses: {204: {description: 'No content'}}
          }
        }
      }
    });
    const openapiDocument = await loadOpenapiFromMemory({
      specString: bodylessSpec
    });
    const generated = await generateTypeScriptChannels({
      generator: {
        ...defaultTypeScriptChannelsGenerator,
        outputPath: `${outputPath}/channels`,
        id: 'test',
        protocols: ['http_server']
      },
      inputType: 'openapi',
      openapiDocument,
      dependencyOutputs: {
        'parameters-typescript': {
          channelModels: {},
          generator: {outputPath: './test'} as any,
          files: []
        },
        'payloads-typescript': {
          channelModels: {},
          operationModels: {},
          otherModels: [],
          generator: {outputPath: './test'} as any,
          files: []
        },
        'headers-typescript': {
          channelModels: {},
          generator: {outputPath: './test'} as any,
          files: []
        }
      }
    } as any);

    // Unlike the client, the server must never skip an operation that exists.
    expect(generated.protocolFiles['http_server']).toContain(
      'function registerDeleteThing('
    );
  });

  it('generates nothing for AsyncAPI input', async () => {
    const asyncapiDocument = await loadAsyncapiDocument({
      documentPath: path.resolve(__dirname, '../../../../configs/asyncapi.yaml')
    });
    const generated = await generateTypeScriptChannels({
      generator: {
        ...defaultTypeScriptChannelsGenerator,
        outputPath: `${outputPath}/channels-asyncapi`,
        id: 'test',
        protocols: ['http_server']
      },
      inputType: 'asyncapi',
      asyncapiDocument,
      dependencyOutputs: {
        'parameters-typescript': {
          channelModels: {},
          generator: {outputPath: './test'} as any,
          files: []
        },
        'payloads-typescript': {
          channelModels: {},
          operationModels: {},
          otherModels: [],
          generator: {outputPath: './test'} as any,
          files: []
        },
        'headers-typescript': {
          channelModels: {},
          generator: {outputPath: './test'} as any,
          files: []
        }
      }
    } as any);

    expect(generated.protocolFiles['http_server']).toBeUndefined();
  });

  it('generates nothing for a protocol OpenAPI does not support', async () => {
    const generated = await generateChannels({protocols: ['nats']});

    expect(generated.protocolFiles['nats']).toBeUndefined();
    expect(generated.protocolFiles['http_server']).toBeUndefined();
  });

  it('groups the register functions by tag', async () => {
    const generated = await generateChannels({
      protocols: ['http_server'],
      organization: 'tag'
    });

    expect(generated.result).toContain('pet');
    expect(generated.result).toMatchSnapshot('http_server-tag-barrel');
  });

  it('nests the register functions by path with the method as the leaf', async () => {
    const generated = await generateChannels({
      protocols: ['http_server'],
      organization: 'path'
    });

    expect(generated.result).toMatchSnapshot('http_server-path-barrel');
  });

  it('appends the import extension to relative imports', async () => {
    const generated = await generateChannels({
      protocols: ['http_server'],
      importExtension: '.js'
    });

    const file = generated.protocolFiles['http_server'];
    const relativeImports = file
      .split('\n')
      .filter((line) => line.includes("from './"));
    expect(relativeImports.length).toBeGreaterThan(0);
    for (const line of relativeImports) {
      expect(line).toMatch(/\.js';$/);
    }
  });
});
