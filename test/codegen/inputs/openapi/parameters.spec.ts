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
});
