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
  it('populates the asyncapi slot for a service that only has asyncapiPath', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'asyncapi-service/eventcatalog'),
      {service: 'user-service'}
    );
    const result = await loadEventCatalog(ctx);
    expect(result.asyncapi).toBeDefined();
    expect(result.openapi).toBeUndefined();
    expect(result.sends).toEqual([]);
    expect(result.receives).toEqual([]);
  });

  it('populates the openapi slot for a service that only has openapiPath', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'openapi-service/eventcatalog'),
      {service: 'petstore-api'}
    );
    const result = await loadEventCatalog(ctx);
    expect(result.openapi).toBeDefined();
    expect(result.asyncapi).toBeUndefined();
  });

  it('exposes native events directly (no AsyncAPI synthesis)', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'native-service/eventcatalog'),
      {service: 'order-service'}
    );
    const result = await loadEventCatalog(ctx);
    expect(result.asyncapi).toBeUndefined();
    expect(result.openapi).toBeUndefined();
    const allEventIds = [...result.sends, ...result.receives].map(
      (event) => event.id
    );
    expect(allEventIds).toEqual(
      expect.arrayContaining(['OrderCreated', 'OrderShipped'])
    );
  });

  it('throws when both specs are declared without a specType to disambiguate', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'both-specs-service/eventcatalog'),
      {service: 'order-service'}
    );
    await expect(loadEventCatalog(ctx)).rejects.toThrow(/specType/);
  });

  it('loads only the AsyncAPI spec when specType is asyncapi', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'both-specs-service/eventcatalog'),
      {service: 'order-service', specType: 'asyncapi'}
    );
    const result = await loadEventCatalog(ctx);
    expect(result.asyncapi).toBeDefined();
    expect(result.openapi).toBeUndefined();
  });

  it('loads only the OpenAPI spec when specType is openapi', async () => {
    const ctx = buildContext(
      path.join(FIXTURES, 'both-specs-service/eventcatalog'),
      {service: 'order-service', specType: 'openapi'}
    );
    const result = await loadEventCatalog(ctx);
    expect(result.openapi).toBeDefined();
    expect(result.asyncapi).toBeUndefined();
  });
});
