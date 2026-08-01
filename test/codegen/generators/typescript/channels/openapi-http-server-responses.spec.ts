/**
 * Assembling the per-operation response variant list is the subtlest part of
 * the HTTP server protocol: it has to merge the status codes declared in the
 * raw document with the body types derived from the response payload models,
 * across three different payload shapes (no model, a single model, a
 * status-code union).
 *
 * It is tested here in isolation, driving the real payloads generator so the
 * models are exactly the ones the channels generator later sees.
 */
import {loadOpenapiFromMemory} from '../../../../../src/codegen/inputs/openapi';
import {
  generateTypescriptPayload,
  TypeScriptPayloadRenderType
} from '../../../../../src/codegen/generators/typescript/payloads';
import {collectServerResponseVariants} from '../../../../../src/codegen/generators/typescript/channels/openapi';
import {HttpServerResponseVariant} from '../../../../../src/codegen/generators/typescript/channels/types';

const petSchema = {
  type: 'object',
  required: ['name'],
  properties: {id: {type: 'integer'}, name: {type: 'string'}}
};

const jsonBody = (schema: unknown) => ({
  description: 'OK',
  content: {'application/json': {schema}}
});

const spec = {
  openapi: '3.0.3',
  info: {title: 'Server responses', version: '1.0.0'},
  paths: {
    // The `addPet` shape: exactly one body-carrying response plus a declared
    // but bodyless error code. `createUnionSchema` returns the schema directly
    // here, so there are no status codes on the model at all.
    '/single': {
      post: {
        operationId: 'singleBodyResponse',
        requestBody: {content: {'application/json': {schema: petSchema}}},
        responses: {
          200: jsonBody(petSchema),
          405: {description: 'Invalid input'}
        }
      }
    },
    // Several body-carrying responses -> a `oneOf` union carrying
    // `x-modelina-status-codes` on each member.
    '/multiple': {
      get: {
        operationId: 'multipleBodyResponses',
        responses: {
          200: jsonBody(petSchema),
          404: jsonBody({
            type: 'object',
            required: ['message'],
            properties: {message: {type: 'string'}}
          }),
          500: {description: 'Server error'}
        }
      }
    },
    // Every declared response is bodyless. The operation must still be
    // registered - the client's "skip when there is nothing to call" rule does
    // not apply to a server.
    '/bodyless': {
      delete: {
        operationId: 'allBodylessResponses',
        responses: {204: {description: 'No content'}}
      }
    },
    // No `responses` at all.
    '/none': {
      get: {
        operationId: 'noResponsesDeclared'
      }
    },
    // A `default` response with a body must sort last.
    '/default': {
      get: {
        operationId: 'defaultResponse',
        responses: {
          200: jsonBody(petSchema),
          default: jsonBody({
            type: 'object',
            properties: {message: {type: 'string'}}
          })
        }
      }
    },
    // A non-object (array) body: module-qualified, no `Interface | Class`
    // widening.
    '/array': {
      get: {
        operationId: 'arrayResponse',
        responses: {
          200: jsonBody({type: 'array', items: petSchema}),
          400: {description: 'Bad request'}
        }
      }
    },
    // Codes >= 400 that DO carry a body are legitimately returnable.
    '/errorbody': {
      get: {
        operationId: 'errorWithBody',
        responses: {
          200: jsonBody(petSchema),
          409: jsonBody({
            type: 'object',
            properties: {conflict: {type: 'string'}}
          })
        }
      }
    }
  }
};

let payloads: TypeScriptPayloadRenderType;
let document: Awaited<ReturnType<typeof loadOpenapiFromMemory>>;

async function variantsFor(
  operationId: string,
  path: string,
  method: string
): Promise<HttpServerResponseVariant[]> {
  const pathItem = (document.paths as Record<string, any>)[path];
  return collectServerResponseVariants({
    operation: pathItem[method],
    // eslint-disable-next-line security/detect-object-injection
    responsePayload: payloads.operationModels[`${operationId}_Response`]
  });
}

describe('OpenAPI HTTP server response variants', () => {
  beforeAll(async () => {
    document = await loadOpenapiFromMemory({specString: JSON.stringify(spec)});
    payloads = await generateTypescriptPayload({
      generator: {
        id: 'test',
        preset: 'payloads',
        outputPath: './test/codegen/generators/typescript/channels/output',
        language: 'typescript',
        dependencies: [],
        serializationType: 'json',
        includeValidation: true,
        useForJavaScript: true,
        rawPropertyNames: false,
        map: 'map',
        enum: 'union'
      },
      inputType: 'openapi',
      openapiDocument: document,
      dependencyOutputs: {}
    });
  });

  it('merges a single body response with declared bodyless codes', async () => {
    const variants = await variantsFor('singleBodyResponse', '/single', 'post');

    expect(variants.map((variant) => variant.statusCode)).toEqual([200, 405]);
    expect(variants[0].bodyType).toBeDefined();
    expect(variants[0].isObjectModel).toBe(true);
    expect(variants[0].bodyInputType).toContain('|');
    expect(variants[1].bodyType).toBeUndefined();
  });

  it('derives a body type per union member from the status code metadata', async () => {
    const variants = await variantsFor(
      'multipleBodyResponses',
      '/multiple',
      'get'
    );

    expect(variants.map((variant) => variant.statusCode)).toEqual([
      200, 404, 500
    ]);
    expect(variants[0].bodyType).toBeDefined();
    expect(variants[1].bodyType).toBeDefined();
    expect(variants[0].bodyType).not.toEqual(variants[1].bodyType);
    // 500 is declared without content, so it stays bodyless.
    expect(variants[2].bodyType).toBeUndefined();
  });

  it('keeps an operation whose responses are all bodyless', async () => {
    const variants = await variantsFor(
      'allBodylessResponses',
      '/bodyless',
      'delete'
    );

    expect(variants).toEqual([{statusCode: 204}]);
  });

  it('returns no variants when the operation declares no responses', async () => {
    const variants = await variantsFor('noResponsesDeclared', '/none', 'get');

    expect(variants).toEqual([]);
  });

  it('sorts the default response last', async () => {
    const variants = await variantsFor('defaultResponse', '/default', 'get');

    expect(variants.map((variant) => variant.statusCode)).toEqual([
      200,
      'default'
    ]);
    expect(variants[1].bodyType).toBeDefined();
  });

  it('module-qualifies a non-object body and does not widen it', async () => {
    const variants = await variantsFor('arrayResponse', '/array', 'get');

    expect(variants.map((variant) => variant.statusCode)).toEqual([200, 400]);
    expect(variants[0].isObjectModel).toBe(false);
    expect(variants[0].bodyModule).toBeDefined();
    expect(variants[0].bodyType).toContain('.');
    expect(variants[0].bodyInputType).toEqual(variants[0].bodyType);
  });

  it('includes error codes that carry a body as returnable variants', async () => {
    const variants = await variantsFor('errorWithBody', '/errorbody', 'get');

    expect(variants.map((variant) => variant.statusCode)).toEqual([200, 409]);
    expect(variants[1].bodyType).toBeDefined();
  });

  it('matches the snapshot of every collected variant list', async () => {
    expect({
      singleBodyResponse: await variantsFor(
        'singleBodyResponse',
        '/single',
        'post'
      ),
      multipleBodyResponses: await variantsFor(
        'multipleBodyResponses',
        '/multiple',
        'get'
      ),
      allBodylessResponses: await variantsFor(
        'allBodylessResponses',
        '/bodyless',
        'delete'
      ),
      defaultResponse: await variantsFor('defaultResponse', '/default', 'get'),
      arrayResponse: await variantsFor('arrayResponse', '/array', 'get'),
      errorWithBody: await variantsFor('errorWithBody', '/errorbody', 'get')
    }).toMatchSnapshot();
  });
});
