import path from 'path';
import {loadEventCatalog} from '../../../../src/codegen/inputs/eventcatalog';
import {RunGeneratorContext} from '../../../../src/codegen/types';

const FIXTURES = path.resolve(__dirname, './__fixtures__');

function buildContext(catalogPath: string, overrides: any = {}): RunGeneratorContext {
  return {
    configuration: {
      inputType: 'eventcatalog' as any,
      inputPath: catalogPath,
      service: 'user-service',
      language: 'typescript',
      generators: [],
      ...overrides
    } as any,
    configFilePath: 'codegen.json',
    documentPath: catalogPath
  };
}

describe('EventCatalog parser (loadEventCatalog)', () => {
  it('returns asyncapi for a service that only has asyncapiPath', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'asyncapi-service/eventcatalog'),
      {service: 'user-service'}
    );
    const result = await loadEventCatalog(ctx);
    expect(result.effectiveInputType).toBe('asyncapi');
    expect(result.asyncapiDocument).toBeDefined();
    expect(result.openapiDocument).toBeUndefined();
  });

  it('returns openapi for a service that only has openapiPath', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'openapi-service/eventcatalog'),
      {service: 'petstore-api'}
    );
    const result = await loadEventCatalog(ctx);
    expect(result.effectiveInputType).toBe('openapi');
    expect(result.openapiDocument).toBeDefined();
    expect(result.asyncapiDocument).toBeUndefined();
  });

  it('synthesizes asyncapi for a native service', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'native-service/eventcatalog'),
      {service: 'order-service'}
    );
    const result = await loadEventCatalog(ctx);
    expect(result.effectiveInputType).toBe('asyncapi');
    expect(result.asyncapiDocument).toBeDefined();
    const json = (result.asyncapiDocument as any).json() as any;
    expect(json.asyncapi).toBe('3.0.0');
    expect(Object.keys(json.channels ?? {})).toEqual(
      expect.arrayContaining(['OrderCreated', 'OrderShipped'])
    );
  });

  it('throws when both specs exist and specType is missing', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'both-specs-service/eventcatalog'),
      {service: 'order-service'}
    );
    await expect(loadEventCatalog(ctx)).rejects.toThrow(/specType/);
  });

  it('honors specType: "openapi" when both specs exist', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'both-specs-service/eventcatalog'),
      {service: 'order-service', specType: 'openapi'}
    );
    const result = await loadEventCatalog(ctx);
    expect(result.effectiveInputType).toBe('openapi');
    expect(result.openapiDocument).toBeDefined();
    expect(result.asyncapiDocument).toBeUndefined();
  });

  it('honors specType: "asyncapi" when both specs exist', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'both-specs-service/eventcatalog'),
      {service: 'order-service', specType: 'asyncapi'}
    );
    const result = await loadEventCatalog(ctx);
    expect(result.effectiveInputType).toBe('asyncapi');
    expect(result.asyncapiDocument).toBeDefined();
    expect(result.openapiDocument).toBeUndefined();
  });
});
