import {OpenAPIV3} from 'openapi-types';
import {processOpenAPIPayloads} from '../../../../src/codegen/inputs/openapi/generators/payloads';

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
});
