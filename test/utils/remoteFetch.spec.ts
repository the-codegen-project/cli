import {fetchRemoteDocument} from '../../src/utils/remoteFetch';
import {CodegenError, ErrorType} from '../../src/codegen/errors';

type FetchMock = jest.SpyInstance<
  ReturnType<typeof fetch>,
  Parameters<typeof fetch>
>;

function mockFetchOnce(
  fetchSpy: FetchMock,
  init: {
    status?: number;
    statusText?: string;
    body?: string;
    contentType?: string;
    finalUrl?: string;
  } = {}
) {
  const status = init.status ?? 200;
  const headers = new Headers();
  if (init.contentType) {
    headers.set('content-type', init.contentType);
  }
  fetchSpy.mockResolvedValueOnce(
    new Response(init.body ?? '{}', {
      status,
      statusText: init.statusText ?? '',
      headers
    })
  );
}

describe('fetchRemoteDocument', () => {
  let fetchSpy: FetchMock;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch') as unknown as FetchMock;
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.useRealTimers();
  });

  it('attaches Authorization header for bearer auth', async () => {
    mockFetchOnce(fetchSpy, {
      body: '{"ok":true}',
      contentType: 'application/json'
    });
    await fetchRemoteDocument('https://example.com/spec.json', {
      type: 'bearer',
      token: 'abc'
    });
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe('Bearer abc');
  });

  it('attaches custom header for apiKey auth', async () => {
    mockFetchOnce(fetchSpy, {body: '{}'});
    await fetchRemoteDocument('https://example.com/spec.json', {
      type: 'apiKey',
      header: 'X-API-Key',
      value: 'secret'
    });
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('x-api-key')).toBe('secret');
  });

  it('attaches all custom headers verbatim', async () => {
    mockFetchOnce(fetchSpy, {body: '{}'});
    await fetchRemoteDocument('https://example.com/spec.json', {
      type: 'custom',
      headers: {Authorization: 'Bearer custom', 'X-Trace': 'abc-123'}
    });
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe('Bearer custom');
    expect(headers.get('x-trace')).toBe('abc-123');
  });

  it('returns content + contentType + finalUrl on 2xx', async () => {
    mockFetchOnce(fetchSpy, {
      body: '{"ok":true}',
      contentType: 'application/json'
    });
    const result = await fetchRemoteDocument(
      'https://example.com/spec.json'
    );
    expect(result.content).toBe('{"ok":true}');
    expect(result.contentType).toBe('application/json');
    expect(result.finalUrl).toBeDefined();
  });

  it('sends no auth headers when none configured', async () => {
    mockFetchOnce(fetchSpy, {body: '{}'});
    await fetchRemoteDocument('https://example.com/spec.json');
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBeNull();
  });

  async function captureRejection(
    fn: () => Promise<unknown>
  ): Promise<CodegenError> {
    try {
      await fn();
    } catch (e) {
      return e as CodegenError;
    }
    throw new Error('expected fetchRemoteDocument to reject');
  }

  it('throws CodegenError with auth-failure help text on 401', async () => {
    mockFetchOnce(fetchSpy, {status: 401, statusText: 'Unauthorized'});
    const err = await captureRejection(() =>
      fetchRemoteDocument('https://example.com/spec.json')
    );
    expect(err.type).toBe(ErrorType.INPUT_DOCUMENT_ERROR);
    expect(err.message).toContain('401');
    expect(err.help?.toLowerCase()).toMatch(/auth/);
  });

  it('throws CodegenError on 403', async () => {
    mockFetchOnce(fetchSpy, {status: 403, statusText: 'Forbidden'});
    await expect(
      fetchRemoteDocument('https://example.com/spec.json')
    ).rejects.toMatchObject({
      message: expect.stringContaining('403')
    });
  });

  it('throws CodegenError with not-found help on 404', async () => {
    mockFetchOnce(fetchSpy, {status: 404, statusText: 'Not Found'});
    const err = await captureRejection(() =>
      fetchRemoteDocument('https://example.com/spec.json')
    );
    expect(err.message).toMatch(/404/);
    expect(err.help?.toLowerCase()).toMatch(/url|verify/);
  });

  it('throws CodegenError with rate-limit help on 429', async () => {
    mockFetchOnce(fetchSpy, {status: 429, statusText: 'Too Many Requests'});
    const err = await captureRejection(() =>
      fetchRemoteDocument('https://example.com/spec.json')
    );
    expect(err.message).toMatch(/429/);
    expect(err.help?.toLowerCase()).toMatch(/rate|retry/);
  });

  it('throws CodegenError on 500', async () => {
    mockFetchOnce(fetchSpy, {status: 500, statusText: 'Server Error'});
    await expect(
      fetchRemoteDocument('https://example.com/spec.json')
    ).rejects.toMatchObject({
      message: expect.stringContaining('500')
    });
  });

  it('throws CodegenError on network failure', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('fetch failed'));
    const err = await captureRejection(() =>
      fetchRemoteDocument('https://example.com/spec.json')
    );
    expect(err).toBeInstanceOf(CodegenError);
    expect(err.help?.toLowerCase()).toMatch(/network|connect/);
  });

  it('throws CodegenError with timeout help on AbortError', async () => {
    fetchSpy.mockImplementationOnce((_url, init) => {
      const signal = (init as RequestInit | undefined)?.signal as
        | AbortSignal
        | undefined;
      return new Promise((_resolve, reject) => {
        if (signal) {
          signal.addEventListener('abort', () => {
            const e = new Error('aborted');
            e.name = 'AbortError';
            reject(e);
          });
        }
      });
    });
    const err = await captureRejection(() =>
      fetchRemoteDocument(
        'https://example.com/spec.json',
        undefined,
        {timeoutMs: 10}
      )
    );
    expect(err).toBeInstanceOf(CodegenError);
    expect(err.help?.toLowerCase()).toMatch(/timeout|timed out/);
  });
});
