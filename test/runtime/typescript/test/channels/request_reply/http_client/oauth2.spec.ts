/* eslint-disable no-console */
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import { createTestServer, runWithServer, createTokenResponse } from './test-utils';
import {
  getPingGetRequest,
  OAuth2Auth,
  RetryConfig,
} from '../../../../src/request-reply/channels/http_client';

jest.setTimeout(15000);

describe('HTTP Client - OAuth2', () => {
  describe('client credentials flow', () => {
    it('should handle OAuth2 client credentials flow', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let tokenRequestReceived = false;
      let tokenRequestBody: string | undefined;
      let apiRequestAuthHeader: string | undefined;
      const refreshedTokens: { accessToken: string; refreshToken?: string }[] = [];

      router.post('/oauth/token', (req, res) => {
        tokenRequestReceived = true;
        tokenRequestBody = JSON.stringify(req.body);
        res.json(createTokenResponse({
          accessToken: 'new-access-token-from-flow',
          refreshToken: 'new-refresh-token'
        }));
      });

      router.get('/ping', (req, res) => {
        apiRequestAuthHeader = req.headers.authorization;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          flow: 'client_credentials',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          tokenUrl: `http://localhost:${port}/oauth/token`,
          scopes: ['read', 'write'],
          onTokenRefresh: (tokens) => {
            refreshedTokens.push(tokens);
          }
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        expect(tokenRequestReceived).toBe(true);
        expect(apiRequestAuthHeader).toBe('Bearer new-access-token-from-flow');
        expect(refreshedTokens.length).toBe(1);
        expect(refreshedTokens[0].accessToken).toBe('new-access-token-from-flow');
      });
    });

    it('should reject OAuth2 client credentials flow without tokenUrl', async () => {
      const { app, router, port } = createTestServer();

      router.get('/ping', (req, res) => {
        res.json({ error: 'should not reach here' });
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          flow: 'client_credentials',
          clientId: 'test-client-id'
        };

        await expect(getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        })).rejects.toThrow('OAuth2 Client Credentials flow requires tokenUrl');
      });
    });
  });

  describe('password flow', () => {
    it('should handle OAuth2 password flow', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let tokenRequestReceived = false;
      let receivedUsername: string | undefined;
      let receivedPassword: string | undefined;
      let apiRequestAuthHeader: string | undefined;

      router.post('/oauth/token', (req, res) => {
        tokenRequestReceived = true;
        receivedUsername = req.body.username;
        receivedPassword = req.body.password;
        res.json(createTokenResponse({
          accessToken: 'password-flow-token'
        }));
      });

      router.get('/ping', (req, res) => {
        apiRequestAuthHeader = req.headers.authorization;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          flow: 'password',
          clientId: 'test-client-id',
          tokenUrl: `http://localhost:${port}/oauth/token`,
          username: 'testuser',
          password: 'testpass'
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        expect(tokenRequestReceived).toBe(true);
        expect(receivedUsername).toBe('testuser');
        expect(receivedPassword).toBe('testpass');
        expect(apiRequestAuthHeader).toBe('Bearer password-flow-token');
      });
    });

    it('should reject OAuth2 password flow without required fields', async () => {
      const { app, router, port } = createTestServer();

      router.get('/ping', (req, res) => {
        res.json({ error: 'should not reach here' });
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          flow: 'password',
          clientId: 'test-client-id',
          tokenUrl: `http://localhost:${port}/oauth/token`
        };

        await expect(getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        })).rejects.toThrow('OAuth2 Password flow requires username');
      });
    });
  });

  describe('token refresh', () => {
    it('should refresh OAuth2 token on 401 response', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;
      let refreshRequestReceived = false;
      const authHeaders: string[] = [];

      router.post('/oauth/token', (req, res) => {
        refreshRequestReceived = true;
        res.json(createTokenResponse({
          accessToken: 'refreshed-token',
          refreshToken: 'new-refresh-token'
        }));
      });

      router.get('/ping', (req, res) => {
        requestCount++;
        authHeaders.push(req.headers.authorization as string);

        if (requestCount === 1) {
          res.status(401).json({ error: 'Token expired' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          accessToken: 'expired-token',
          refreshToken: 'valid-refresh-token',
          clientId: 'test-client-id',
          tokenUrl: `http://localhost:${port}/oauth/token`
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        expect(refreshRequestReceived).toBe(true);
        expect(requestCount).toBe(2);
        expect(authHeaders[0]).toBe('Bearer expired-token');
        expect(authHeaders[1]).toBe('Bearer refreshed-token');
        expect(response.data).toBeDefined();
      });
    });
  });

  describe('OAuth2 with retry logic', () => {
    it('should retry authenticated request after client_credentials flow when server returns 503', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let tokenRequestCount = 0;
      let authenticatedRequestCount = 0;
      const retryCalls: number[] = [];

      router.post('/oauth/token', (req, res) => {
        tokenRequestCount++;
        res.json(createTokenResponse({
          accessToken: 'flow-token'
        }));
      });

      router.get('/ping', (req, res) => {
        // Only count authenticated requests (those with Bearer token)
        const hasAuth = req.headers.authorization?.startsWith('Bearer ');
        if (hasAuth) {
          authenticatedRequestCount++;
          if (authenticatedRequestCount < 3) {
            res.status(503).json({ error: 'Service Unavailable' });
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.write(replyMessage.marshal());
            res.end();
          }
        } else {
          // Initial request without auth - let it pass to trigger OAuth flow
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          flow: 'client_credentials',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          tokenUrl: `http://localhost:${port}/oauth/token`
        };

        const retry: RetryConfig = {
          maxRetries: 5,
          initialDelayMs: 50,
          retryableStatusCodes: [503],
          onRetry: (attempt) => {
            retryCalls.push(attempt);
          }
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth,
          retry
        });

        expect(tokenRequestCount).toBe(1);
        // 3 authenticated requests: 2 failed with 503, 1 succeeded
        expect(authenticatedRequestCount).toBe(3);
        expect(retryCalls.length).toBe(2);
        expect(response.data).toBeDefined();
      });
    });

    it('should retry authenticated request after password flow when server returns 500', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let tokenRequestCount = 0;
      let authenticatedRequestCount = 0;

      router.post('/oauth/token', (req, res) => {
        tokenRequestCount++;
        res.json(createTokenResponse({
          accessToken: 'password-token'
        }));
      });

      router.get('/ping', (req, res) => {
        const hasAuth = req.headers.authorization?.startsWith('Bearer ');
        if (hasAuth) {
          authenticatedRequestCount++;
          if (authenticatedRequestCount < 2) {
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.write(replyMessage.marshal());
            res.end();
          }
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          flow: 'password',
          clientId: 'test-client-id',
          tokenUrl: `http://localhost:${port}/oauth/token`,
          username: 'user',
          password: 'pass'
        };

        const retry: RetryConfig = {
          maxRetries: 3,
          initialDelayMs: 50,
          retryableStatusCodes: [500]
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth,
          retry
        });

        expect(tokenRequestCount).toBe(1);
        // 2 authenticated requests: 1 failed with 500, 1 succeeded
        expect(authenticatedRequestCount).toBe(2);
        expect(response.data).toBeDefined();
      });
    });

    it('should retry authenticated request after token refresh when server returns 502', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let refreshRequestCount = 0;
      let apiRequestCount = 0;
      const authHeaders: string[] = [];

      router.post('/oauth/token', (req, res) => {
        refreshRequestCount++;
        res.json(createTokenResponse({
          accessToken: 'refreshed-token',
          refreshToken: 'new-refresh-token'
        }));
      });

      router.get('/ping', (req, res) => {
        apiRequestCount++;
        authHeaders.push(req.headers.authorization as string);

        if (apiRequestCount === 1) {
          res.status(401).json({ error: 'Token expired' });
        } else if (apiRequestCount < 4) {
          res.status(502).json({ error: 'Bad Gateway' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          accessToken: 'expired-token',
          refreshToken: 'valid-refresh-token',
          clientId: 'test-client-id',
          tokenUrl: `http://localhost:${port}/oauth/token`
        };

        const retry: RetryConfig = {
          maxRetries: 5,
          initialDelayMs: 50,
          retryableStatusCodes: [502]
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth,
          retry
        });

        expect(refreshRequestCount).toBe(1);
        expect(apiRequestCount).toBe(4);
        expect(authHeaders[0]).toBe('Bearer expired-token');
        expect(authHeaders[1]).toBe('Bearer refreshed-token');
        expect(response.data).toBeDefined();
      });
    });

    it('should fail after max retries exhausted on OAuth2 authenticated request', async () => {
      const { app, router, port } = createTestServer();

      let tokenRequestCount = 0;
      let authenticatedRequestCount = 0;

      router.post('/oauth/token', (req, res) => {
        tokenRequestCount++;
        res.json(createTokenResponse({
          accessToken: 'flow-token'
        }));
      });

      router.get('/ping', (req, res) => {
        const hasAuth = req.headers.authorization?.startsWith('Bearer ');
        if (hasAuth) {
          authenticatedRequestCount++;
          res.status(503).json({ error: 'Service Unavailable' });
        } else {
          // Initial request without auth - let it pass to trigger OAuth flow
          res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify({}));
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          flow: 'client_credentials',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          tokenUrl: `http://localhost:${port}/oauth/token`
        };

        const retry: RetryConfig = {
          maxRetries: 2,
          initialDelayMs: 50,
          retryableStatusCodes: [503]
        };

        await expect(getPingGetRequest({
          server: `http://localhost:${port}`,
          auth,
          retry
        })).rejects.toThrow();

        expect(tokenRequestCount).toBe(1);
        // maxRetries=2: attempt 0 (initial), attempt 1 (retry), then shouldRetry(attempt=2) returns false
        // So 2 total authenticated requests before giving up
        expect(authenticatedRequestCount).toBe(2);
      });
    });

    it('should apply exponential backoff on OAuth2 authenticated request retries', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let apiRequestCount = 0;
      const delays: number[] = [];

      router.post('/oauth/token', (req, res) => {
        res.json(createTokenResponse({
          accessToken: 'flow-token'
        }));
      });

      router.get('/ping', (req, res) => {
        apiRequestCount++;
        if (apiRequestCount < 4) {
          res.status(503).json({ error: 'Service Unavailable' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          flow: 'client_credentials',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          tokenUrl: `http://localhost:${port}/oauth/token`
        };

        const retry: RetryConfig = {
          maxRetries: 5,
          initialDelayMs: 100,
          backoffMultiplier: 2,
          retryableStatusCodes: [503],
          onRetry: (attempt, delay) => {
            delays.push(delay);
          }
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth,
          retry
        });

        expect(delays.length).toBe(3);
        expect(delays[0]).toBe(100);
        expect(delays[1]).toBe(200);
        expect(delays[2]).toBe(400);
      });
    });
  });

  describe('edge cases', () => {
    it('should skip token flow for unsupported OAuth2 flow types', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let tokenEndpointHit = false;
      let receivedAuthHeader: string | undefined;

      router.post('/oauth/token', (req, res) => {
        tokenEndpointHit = true;
        res.json(createTokenResponse({ accessToken: 'should-not-get-this' }));
      });

      router.get('/ping', (req, res) => {
        receivedAuthHeader = req.headers.authorization;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        // Use 'implicit' flow which is not supported for token fetching
        const auth: OAuth2Auth = {
          type: 'oauth2',
          flow: 'implicit' as any,
          clientId: 'test-client',
          tokenUrl: `http://localhost:${port}/oauth/token`,
          accessToken: 'pre-existing-token'
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        // Token endpoint should NOT be hit because we have accessToken
        expect(tokenEndpointHit).toBe(false);
        expect(receivedAuthHeader).toBe('Bearer pre-existing-token');
        expect(response.data).toBeDefined();
      });
    });

    it('should use accessToken directly when no flow is specified', async () => {
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
        // When no flow is specified but accessToken is provided,
        // it should be used directly without fetching
        const auth: OAuth2Auth = {
          type: 'oauth2',
          accessToken: 'existing-token'
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        expect(receivedAuthHeader).toBe('Bearer existing-token');
        expect(response.data).toBeDefined();
      });
    });

    it('should use existing accessToken without fetching new token', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let tokenEndpointHit = false;

      router.post('/oauth/token', (req, res) => {
        tokenEndpointHit = true;
        res.json(createTokenResponse({ accessToken: 'new-token' }));
      });

      router.get('/ping', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          flow: 'client_credentials',
          clientId: 'test-client',
          tokenUrl: `http://localhost:${port}/oauth/token`,
          accessToken: 'already-have-token'  // This should prevent token fetch
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        // Should not hit token endpoint since we already have accessToken
        expect(tokenEndpointHit).toBe(false);
      });
    });

    it('should call onTokenRefresh callback when token is refreshed', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;
      const refreshedTokens: { accessToken: string; refreshToken?: string }[] = [];

      router.post('/oauth/token', (req, res) => {
        res.json(createTokenResponse({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }));
      });

      router.get('/ping', (req, res) => {
        requestCount++;
        if (requestCount === 1) {
          res.status(401).json({ error: 'Token expired' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const auth: OAuth2Auth = {
          type: 'oauth2',
          accessToken: 'expired-token',
          refreshToken: 'valid-refresh',
          clientId: 'test-client',
          tokenUrl: `http://localhost:${port}/oauth/token`,
          onTokenRefresh: (tokens) => {
            refreshedTokens.push(tokens);
          }
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          auth
        });

        expect(refreshedTokens.length).toBe(1);
        expect(refreshedTokens[0].accessToken).toBe('new-access-token');
        expect(refreshedTokens[0].refreshToken).toBe('new-refresh-token');
      });
    });
  });
});
