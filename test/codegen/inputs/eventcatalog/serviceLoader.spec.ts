import path from 'path';
import {loadServiceMetadata} from '../../../../src/codegen/inputs/eventcatalog/serviceLoader';

const FIXTURES = path.resolve(__dirname, './__fixtures__');

const asyncapiCatalog = path.join(FIXTURES, 'asyncapi-service/eventcatalog');
const openapiCatalog = path.join(FIXTURES, 'openapi-service/eventcatalog');
const nativeCatalog = path.join(FIXTURES, 'native-service/eventcatalog');
const bothSpecsCatalog = path.join(FIXTURES, 'both-specs-service/eventcatalog');
const missingServiceCatalog = path.join(
  FIXTURES,
  'invalid/missing-service/eventcatalog'
);
const missingFrontmatterCatalog = path.join(
  FIXTURES,
  'invalid/missing-frontmatter/eventcatalog'
);

describe('EventCatalog serviceLoader', () => {
  it('resolves service metadata for an AsyncAPI service', () => {
    const metadata = loadServiceMetadata(asyncapiCatalog, 'user-service');
    expect(metadata.id).toBe('user-service');
    expect(metadata.name).toBe('User Service');
    expect(metadata.version).toBe('1.0.0');
    expect(metadata.specifications?.asyncapiPath).toMatch(/asyncapi\.yaml$/);
    expect(metadata.specifications?.openapiPath).toBeUndefined();
    expect(metadata.sends.map((e) => e.id)).toEqual(['UserSignedUp']);
    expect(metadata.receives).toEqual([]);
  });

  it('resolves service metadata for an OpenAPI service', () => {
    const metadata = loadServiceMetadata(openapiCatalog, 'petstore-api');
    expect(metadata.id).toBe('petstore-api');
    expect(metadata.specifications?.openapiPath).toMatch(/openapi\.json$/);
    expect(metadata.specifications?.asyncapiPath).toBeUndefined();
  });

  it('parses native services without specifications', () => {
    const metadata = loadServiceMetadata(nativeCatalog, 'order-service');
    expect(metadata.specifications).toBeUndefined();
    expect(metadata.sends.map((e) => e.id)).toEqual(['OrderCreated']);
    expect(metadata.receives.map((e) => e.id)).toEqual(['OrderShipped']);
  });

  it('parses both asyncapiPath and openapiPath when provided', () => {
    const metadata = loadServiceMetadata(bothSpecsCatalog, 'order-service');
    expect(metadata.specifications?.asyncapiPath).toMatch(/asyncapi\.yaml$/);
    expect(metadata.specifications?.openapiPath).toMatch(/openapi\.json$/);
  });

  it('resolves service paths to absolute paths inside the service directory', () => {
    const metadata = loadServiceMetadata(asyncapiCatalog, 'user-service');
    expect(path.isAbsolute(metadata.serviceDir)).toBe(true);
    expect(path.isAbsolute(metadata.specifications!.asyncapiPath!)).toBe(true);
  });

  it('throws when the service directory does not exist and lists known services', () => {
    expect(() =>
      loadServiceMetadata(asyncapiCatalog, 'unknown-service')
    ).toThrow(/unknown-service/);
    expect(() =>
      loadServiceMetadata(asyncapiCatalog, 'unknown-service')
    ).toThrow(/user-service/);
  });

  it('throws when services/<id>/index.md is missing', () => {
    expect(() =>
      loadServiceMetadata(missingServiceCatalog, 'whatever')
    ).toThrow(/whatever/);
  });

  it('throws when index.md has no frontmatter', () => {
    expect(() =>
      loadServiceMetadata(missingFrontmatterCatalog, 'broken-service')
    ).toThrow(/frontmatter|YAML/i);
  });

  it('uses the exact service ID supplied by the user when looking up the directory', () => {
    // We can't reliably assert case-sensitivity because Windows + macOS
    // filesystems are case-insensitive by default. Instead we assert that
    // the service ID we asked for is preserved in the returned metadata.
    const metadata = loadServiceMetadata(asyncapiCatalog, 'user-service');
    expect(metadata.id).toBe('user-service');
  });
});
