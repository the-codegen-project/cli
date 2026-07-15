/* eslint-disable no-console */
/**
 * Regression test for primitive-typed response payloads.
 *
 * Payloads whose schema is a primitive (e.g. `type: string`/`number`) generate
 * `unmarshal(json: string)` which JSON.parses its argument. The HTTP client must
 * therefore hand unmarshal the raw JSON text, not the already-parsed value from
 * response.json(). Before the fix this threw at runtime (JSON.parse on an
 * already-parsed primitive). See fix/openapi-http-client-primitive-response.
 */
import { createTestServer, runWithServer } from './test-utils';
import { getEcho, getCount } from '../../../../src/openapi-primitive/channels/http_client';

jest.setTimeout(15000);

describe('HTTP Client - primitive response payloads', () => {
  it('unmarshals a plain string body', async () => {
    const { app, router, port } = createTestServer();

    router.get('/echo', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify('hello world'));
    });

    return runWithServer(app, port, async (_server, actualPort) => {
      const response = await getEcho({ baseUrl: `http://localhost:${actualPort}` });

      expect(response.status).toBe(200);
      expect(response.data).toBe('hello world');
    });
  });

  it('unmarshals a plain number body', async () => {
    const { app, router, port } = createTestServer();

    router.get('/count', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(42));
    });

    return runWithServer(app, port, async (_server, actualPort) => {
      const response = await getCount({ baseUrl: `http://localhost:${actualPort}` });

      expect(response.status).toBe(200);
      expect(response.data).toBe(42);
    });
  });
});
