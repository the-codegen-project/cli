import {OpenAPIV3} from 'openapi-types';
import {processOpenAPIParameters} from '../../../../src/codegen/inputs/openapi/generators/parameters';
import {Logger} from '../../../../src/LoggingInterface';

describe('OpenAPI parameter extraction', () => {
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('warns that cookie parameters are dropped, without affecting path/query params', () => {
    const document: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {title: 'Test API', version: '1.0.0'},
      paths: {
        '/things/{id}': {
          get: {
            parameters: [
              {name: 'id', in: 'path', required: true, schema: {type: 'string'}},
              {name: 'session', in: 'cookie', schema: {type: 'string'}}
            ],
            responses: {200: {description: 'OK'}}
          }
        }
      }
    } as OpenAPIV3.Document;

    const {channelParameters} = processOpenAPIParameters(document);

    // Path/query params are still processed for the operation.
    expect(Object.keys(channelParameters).length).toBeGreaterThan(0);

    // The dropped cookie parameter must be reported.
    expect(warnSpy).toHaveBeenCalled();
    const warned = warnSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(warned.toLowerCase()).toContain('cookie');
    expect(warned).toContain('session');
  });

  it('inherits path-item level parameters into every operation under it', () => {
    // Declaring a shared parameter once on the path item is the idiomatic way to
    // avoid repeating it per method. Dropping it left the operation with no
    // parameter model, so `{petId}` was never substituted and the request went
    // out with the literal placeholder in its URL.
    const document: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {title: 'Pet API', version: '1.0.0'},
      paths: {
        '/pets/{petId}': {
          parameters: [
            {name: 'petId', in: 'path', required: true, schema: {type: 'string'}}
          ],
          get: {
            operationId: 'getPet',
            responses: {200: {description: 'OK'}}
          },
          delete: {
            operationId: 'deletePet',
            responses: {204: {description: 'Deleted'}}
          }
        }
      }
    } as OpenAPIV3.Document;

    const {channelParameters} = processOpenAPIParameters(document);

    for (const operationId of ['getPet', 'deletePet']) {
      // eslint-disable-next-line security/detect-object-injection
      const parameters = channelParameters[operationId];
      expect(parameters).toBeDefined();
      expect(Object.keys(parameters.schema.properties)).toEqual(['petId']);
    }
  });

  it('lets an operation override an inherited parameter of the same name and location', () => {
    const document: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {title: 'Pet API', version: '1.0.0'},
      paths: {
        '/pets/{petId}': {
          parameters: [
            {name: 'petId', in: 'path', required: true, schema: {type: 'string'}}
          ],
          get: {
            operationId: 'getPet',
            parameters: [
              {
                name: 'petId',
                in: 'path',
                required: true,
                schema: {type: 'integer'}
              }
            ],
            responses: {200: {description: 'OK'}}
          }
        }
      }
    } as OpenAPIV3.Document;

    const {channelParameters} = processOpenAPIParameters(document);
    const properties = channelParameters['getPet'].schema.properties;

    // Declared once, with the operation's own type winning.
    expect(Object.keys(properties)).toEqual(['petId']);
    expect(properties.petId.type).toEqual('integer');
  });

  it('does not treat non-method path item keys as operations', () => {
    const document: OpenAPIV3.Document = {
      openapi: '3.0.0',
      info: {title: 'Pet API', version: '1.0.0'},
      paths: {
        '/pets/{petId}': {
          summary: 'A pet',
          description: 'Operations on one pet',
          servers: [{url: 'https://pets.example'}],
          parameters: [
            {name: 'petId', in: 'path', required: true, schema: {type: 'string'}}
          ],
          get: {operationId: 'getPet', responses: {200: {description: 'OK'}}}
        }
      }
    } as OpenAPIV3.Document;

    const {channelParameters} = processOpenAPIParameters(document);

    expect(Object.keys(channelParameters)).toEqual(['getPet']);
  });
});
