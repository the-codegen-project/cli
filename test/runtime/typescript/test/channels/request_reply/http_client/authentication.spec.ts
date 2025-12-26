/* eslint-disable no-console */
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import { createTestServer, runWithServer } from './test-utils';
import {
  getPingGetRequest,
  AuthConfig,
} from '../../../../src/request-reply/channels/http_client';

jest.setTimeout(15000);

describe('HTTP Client - Authentication', () => {
  describe('bearer token', () => {
    it('should send bearer token in Authorization header', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedAuthHeader: string | undefined;

      router.get('/ping', (req, res) => {
        receivedAuthHeader = req.headers.authorization;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const auth: AuthConfig = { type: 'bearer', token: 'test-token-123' };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        expect(receivedAuthHeader).toBe('Bearer test-token-123');
      });
    });
  });

  describe('basic auth', () => {
    it('should send basic auth credentials', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedAuthHeader: string | undefined;

      router.get('/ping', (req, res) => {
        receivedAuthHeader = req.headers.authorization;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const auth: AuthConfig = { type: 'basic', username: 'user', password: 'pass' };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        const expectedCredentials = Buffer.from('user:pass').toString('base64');
        expect(receivedAuthHeader).toBe(`Basic ${expectedCredentials}`);
      });
    });
  });

  describe('API key', () => {
    it('should send API key in header', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedApiKey: string | undefined;

      router.get('/ping', (req, res) => {
        receivedApiKey = req.headers['x-api-key'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const auth: AuthConfig = { type: 'apiKey', key: 'my-api-key-123' };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        expect(receivedApiKey).toBe('my-api-key-123');
      });
    });

    it('should send API key in query string', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedApiKey: string | undefined;

      router.get('/ping', (req, res) => {
        receivedApiKey = req.query['api_key'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const auth: AuthConfig = {
          type: 'apiKey',
          key: 'my-api-key-123',
          name: 'api_key',
          in: 'query'
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        expect(receivedApiKey).toBe('my-api-key-123');
      });
    });

    it('should use custom API key header name', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedApiKey: string | undefined;

      router.get('/ping', (req, res) => {
        receivedApiKey = req.headers['x-custom-auth'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const auth: AuthConfig = {
          type: 'apiKey',
          key: 'custom-key-value',
          name: 'X-Custom-Auth',
          in: 'header'
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        expect(receivedApiKey).toBe('custom-key-value');
      });
    });

    it('should handle API key in query string with existing query params', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedApiKey: string | undefined;
      let receivedFilter: string | undefined;

      router.get('/ping', (req, res) => {
        receivedApiKey = req.query['api_key'] as string;
        receivedFilter = req.query['filter'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth: {
            type: 'apiKey',
            key: 'secret-key',
            name: 'api_key',
            in: 'query'
          },
          queryParams: {
            filter: 'active'
          }
        });

        expect(receivedApiKey).toBe('secret-key');
        expect(receivedFilter).toBe('active');
      });
    });
  });

  describe('OAuth2 access token', () => {
    it('should use OAuth2 access token', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedAuthHeader: string | undefined;

      router.get('/ping', (req, res) => {
        receivedAuthHeader = req.headers.authorization;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const auth: AuthConfig = {
          type: 'oauth2',
          accessToken: 'oauth-access-token-xyz'
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        expect(receivedAuthHeader).toBe('Bearer oauth-access-token-xyz');
      });
    });
  });

  describe('combined with additional headers', () => {
    it('should combine auth with additional headers', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedAuthHeader: string | undefined;
      let receivedCustomHeader: string | undefined;
      let receivedTraceId: string | undefined;

      router.get('/ping', (req, res) => {
        receivedAuthHeader = req.headers.authorization;
        receivedCustomHeader = req.headers['x-custom-header'] as string;
        receivedTraceId = req.headers['x-trace-id'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth: { type: 'bearer', token: 'my-token' },
          additionalHeaders: {
            'X-Custom-Header': 'custom-value',
            'X-Trace-Id': 'trace-123'
          }
        });

        expect(receivedAuthHeader).toBe('Bearer my-token');
        expect(receivedCustomHeader).toBe('custom-value');
        expect(receivedTraceId).toBe('trace-123');
      });
    });
  });
});
