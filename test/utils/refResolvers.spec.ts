import {
  createOpenapiRefParserResolver,
  createAsyncapiResolvers
} from '../../src/utils/refResolvers';
import {fetchRemoteDocument} from '../../src/utils/remoteFetch';
import {Logger} from '../../src/LoggingInterface';

jest.mock('../../src/utils/remoteFetch', () => ({
  fetchRemoteDocument: jest.fn()
}));

describe('refResolvers', () => {
  const fetchSpy = fetchRemoteDocument as jest.MockedFunction<
    typeof fetchRemoteDocument
  >;

  beforeEach(() => {
    fetchSpy.mockReset();
    fetchSpy.mockResolvedValue({
      content: '{"ok":true}',
      contentType: 'application/json',
      finalUrl: 'https://example.com/ref.json'
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createOpenapiRefParserResolver', () => {
    it('returns an HTTPResolverOptions object with a read function', () => {
      const resolver = createOpenapiRefParserResolver(undefined, {
        rootUrl: 'https://api.example.com/openapi.yaml'
      });
      expect(typeof resolver.read).toBe('function');
    });

    it('read() delegates to fetchRemoteDocument with the configured auth', async () => {
      const auth = {type: 'bearer' as const, token: 'abc'};
      const resolver = createOpenapiRefParserResolver(auth, {
        rootUrl: 'https://api.example.com/openapi.yaml'
      });
      const read = resolver.read as (file: {url: string}) => Promise<string>;
      const result = await read({url: 'https://api.example.com/components.yaml'});
      expect(result).toBe('{"ok":true}');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example.com/components.yaml',
        auth
      );
    });

    it('emits a debug log per fetched URL', async () => {
      const debugSpy = jest.spyOn(Logger, 'debug').mockImplementation(() => undefined);
      const resolver = createOpenapiRefParserResolver(undefined, {
        rootUrl: 'https://api.example.com/openapi.yaml'
      });
      const read = resolver.read as (file: {url: string}) => Promise<string>;
      await read({url: 'https://api.example.com/components.yaml'});
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://api.example.com/components.yaml')
      );
    });

    it('emits one info-level log per distinct cross-host destination', async () => {
      const infoSpy = jest.spyOn(Logger, 'info').mockImplementation(() => undefined);
      const resolver = createOpenapiRefParserResolver(
        {type: 'bearer', token: 'abc'},
        {rootUrl: 'https://api.example.com/openapi.yaml'}
      );
      const read = resolver.read as (file: {url: string}) => Promise<string>;
      // Two refs to the same cross-host -> info log fires once
      await read({url: 'https://schemas.public.example.org/Pet.yaml'});
      await read({url: 'https://schemas.public.example.org/Order.yaml'});
      // A second cross-host -> a second info log
      await read({url: 'https://other.example.net/Foo.yaml'});
      // Same-host ref -> no additional info log
      await read({url: 'https://api.example.com/components.yaml'});

      const crossHostLogs = infoSpy.mock.calls.filter(([msg]) =>
        String(msg).includes('auth headers sent to')
      );
      expect(crossHostLogs.length).toBe(2);
    });

    it('does not emit cross-host warning when no auth is configured', async () => {
      const infoSpy = jest.spyOn(Logger, 'info').mockImplementation(() => undefined);
      const resolver = createOpenapiRefParserResolver(undefined, {
        rootUrl: 'https://api.example.com/openapi.yaml'
      });
      const read = resolver.read as (file: {url: string}) => Promise<string>;
      await read({url: 'https://other.example.net/Foo.yaml'});
      const crossHostLogs = infoSpy.mock.calls.filter(([msg]) =>
        String(msg).includes('auth headers sent to')
      );
      expect(crossHostLogs.length).toBe(0);
    });
  });

  describe('createAsyncapiResolvers', () => {
    it('returns an array with two resolvers (http + https)', () => {
      const resolvers = createAsyncapiResolvers(undefined, {
        rootUrl: 'https://api.example.com/asyncapi.yaml'
      });
      expect(Array.isArray(resolvers)).toBe(true);
      expect(resolvers.map((r) => r.schema).sort()).toEqual(['http', 'https']);
    });

    it('read() delegates to fetchRemoteDocument with the configured auth', async () => {
      const auth = {type: 'apiKey' as const, header: 'X-API-Key', value: 'k'};
      const resolvers = createAsyncapiResolvers(auth, {
        rootUrl: 'https://api.example.com/asyncapi.yaml'
      });
      const httpsResolver = resolvers.find((r) => r.schema === 'https')!;
      // Spectral resolvers use a urijs-like Uri object; both `.toString()`
      // and string coercion must work. Use a minimal stub.
      const uri = {
        toString: () => 'https://api.example.com/components.yaml'
      };
      const result = await httpsResolver.read(uri as any);
      expect(result).toBe('{"ok":true}');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example.com/components.yaml',
        auth
      );
    });
  });
});
