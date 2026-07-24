import {OpenAPIV3} from 'openapi-types';
import {processOpenAPIPayloads} from '../../../../src/codegen/inputs/openapi/generators/payloads';
import {Logger} from '../../../../src/LoggingInterface';

const operationDoc = (content: Record<string, unknown>): OpenAPIV3.Document =>
  ({
    openapi: '3.0.0',
    info: {title: 'Test API', version: '1.0.0'},
    paths: {
      '/things': {
        get: {
          responses: {
            200: {
              description: 'OK',
              content
            }
          }
        }
      }
    }
  }) as OpenAPIV3.Document;

describe('OpenAPI payload extraction', () => {
  describe('processOpenAPIPayloads', () => {
    it('extracts the request body of a 3.x operation that also declares parameters', () => {
      // Regression: a 3.x operation carrying both `parameters` (header/path/query)
      // and a `requestBody` must not be mistaken for OpenAPI 2.0 - the body was
      // previously dropped whenever any parameter was present.
      const document: OpenAPIV3.Document = {
        openapi: '3.0.0',
        info: {title: 'Test API', version: '1.0.0'},
        paths: {
          '/things': {
            post: {
              parameters: [
                {
                  name: 'X-Correlation-Id',
                  in: 'header',
                  schema: {type: 'string'}
                }
              ],
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {name: {type: 'string'}}
                    }
                  }
                }
              },
              responses: {
                200: {
                  description: 'OK',
                  content: {
                    'application/json': {
                      schema: {type: 'object', properties: {id: {type: 'string'}}}
                    }
                  }
                }
              }
            }
          }
        }
      };

      const {operationPayloads} = processOpenAPIPayloads(document);

      // The request body surfaces as an operation payload whose schema id ends
      // in `Request`; before the fix only the `Response` payload was present.
      const schemaIds = Object.values(operationPayloads).map(
        (payload) => payload.schemaId
      );
      expect(schemaIds.some((id) => id.endsWith('Request'))).toBe(true);
      expect(schemaIds.some((id) => id.endsWith('Response'))).toBe(true);
    });
  });

  describe('content-type fidelity and warnings', () => {
    let warnSpy: jest.SpyInstance;
    beforeEach(() => {
      warnSpy = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('extracts a payload from a +json content type (e.g. application/hal+json)', () => {
      const document = operationDoc({
        'application/hal+json': {
          schema: {type: 'object', properties: {id: {type: 'string'}}}
        }
      });
      const {operationPayloads} = processOpenAPIPayloads(document);
      const schemaIds = Object.values(operationPayloads).map((p) => p.schemaId);
      expect(schemaIds.some((id) => id.endsWith('Response'))).toBe(true);
    });

    it('warns and produces no payload when an operation only has non-JSON content', () => {
      const document = operationDoc({
        'application/xml': {
          schema: {type: 'object', properties: {id: {type: 'string'}}}
        }
      });
      const {operationPayloads} = processOpenAPIPayloads(document);
      expect(Object.keys(operationPayloads)).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalled();
      const warned = warnSpy.mock.calls.map((c) => String(c[0])).join('\n');
      expect(warned).toContain('/things');
      expect(warned.toLowerCase()).toContain('xml');
    });

    it('warns once when the document declares webhooks (unsupported)', () => {
      const document = {
        openapi: '3.1.0',
        info: {title: 'Test API', version: '1.0.0'},
        paths: {},
        webhooks: {
          newThing: {
            post: {
              requestBody: {
                content: {
                  'application/json': {schema: {type: 'object'}}
                }
              },
              responses: {200: {description: 'OK'}}
            }
          }
        }
      } as any;
      processOpenAPIPayloads(document);
      const warned = warnSpy.mock.calls.map((c) => String(c[0])).join('\n');
      expect(warned.toLowerCase()).toContain('webhook');
    });
  });
});
