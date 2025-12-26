/* eslint-disable no-console */
/**
 * OAuth2 Pre-obtained Access Token Tests
 *
 * NOTE: The implicit flow has been intentionally removed from the generated HTTP client.
 *
 * The implicit flow is a browser-based OAuth2 flow that requires:
 * - Browser redirects to authorization server
 * - User interaction for consent
 * - Token returned via URL fragment (#access_token=...)
 *
 * This flow cannot be implemented in server-side generated code because:
 * 1. It requires browser interaction
 * 2. It's deprecated per OAuth 2.1 specification
 * 3. It has security vulnerabilities (token exposure in URLs)
 *
 * For browser-based applications:
 * - Obtain tokens using your frontend framework's OAuth2 library
 * - Pass the obtained access token to the generated client:
 *   auth: { type: 'oauth2', accessToken: 'your-token' }
 *
 * For server-to-server authentication:
 * - Use client_credentials flow: auth: { type: 'oauth2', flow: 'client_credentials', ... }
 * - Use password flow (legacy): auth: { type: 'oauth2', flow: 'password', ... }
 */

import { Ping } from "../../../../src/request-reply/payloads/Ping";
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import { createTestServer, runWithServer } from './test-utils';
import { postPingPostRequest } from '../../../../src/request-reply/channels/http_client';
import bodyParser from 'body-parser';

jest.setTimeout(10000);
describe('HTTP Client - OAuth2 Pre-obtained Access Token', () => {
  describe('Using pre-obtained access token (for browser-obtained tokens)', () => {
    it('should authenticate with a pre-obtained access token', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const ACCESS_TOKEN = 'pre-obtained-token-from-browser-flow';

      router.post('/ping', (req, res) => {
        // Check if Authorization header is present
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Unauthorized - Bearer Authentication Required' });
        }

        // Validate the Bearer token
        const token = authHeader.split(' ')[1];
        if (token !== ACCESS_TOKEN) {
          return res.status(401).json({ error: 'Unauthorized - Invalid Token' });
        }

        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        // This is how you'd use a token obtained from a browser-based flow
        // (implicit, authorization_code via PKCE, etc.)
        const response = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          auth: {
            type: 'oauth2',
            accessToken: ACCESS_TOKEN
          }
        });

        expect(response.data?.marshal()).toEqual(replyMessage.marshal());
        expect(response.status).toEqual(200);
      });
    });

    it('should support refresh token with pre-obtained access token', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));

      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const EXPIRED_ACCESS_TOKEN = 'expired-token';
      const REFRESH_TOKEN = 'refresh-token-from-original-auth';
      const NEW_ACCESS_TOKEN = 'new-access-token';
      const CLIENT_ID = 'my-client-id';

      // Mock token endpoint for refresh
      router.post('/oauth/token', (req, res) => {
        if (req.body.grant_type === 'refresh_token' && req.body.refresh_token === REFRESH_TOKEN) {
          return res.json({
            access_token: NEW_ACCESS_TOKEN,
            token_type: 'Bearer',
            expires_in: 3600
          });
        }
        res.status(401).json({ error: 'invalid_grant' });
      });

      // Protected endpoint
      let requestCount = 0;
      router.post('/ping', (req, res) => {
        const token = req.headers.authorization?.split(' ')[1];

        // First request with expired token returns 401
        if (requestCount === 0 && token === EXPIRED_ACCESS_TOKEN) {
          requestCount++;
          return res.status(401).json({ error: 'Token Expired' });
        }

        // Second request with new token succeeds
        if (token === NEW_ACCESS_TOKEN) {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
          return;
        }

        res.status(401).json({ error: 'Invalid Token' });
      });

      return runWithServer(app, port, async () => {
        const onTokenRefresh = jest.fn();

        // Use pre-obtained token with refresh capability
        const response = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          auth: {
            type: 'oauth2',
            accessToken: EXPIRED_ACCESS_TOKEN,
            refreshToken: REFRESH_TOKEN,
            tokenUrl: `http://localhost:${port}/oauth/token`,
            clientId: CLIENT_ID,
            onTokenRefresh
          }
        });

        expect(onTokenRefresh).toHaveBeenCalled();
        expect(response.data?.marshal()).toEqual(replyMessage.marshal());
      });
    });

    it('should work without any flow specified when access token is provided', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const ACCESS_TOKEN = 'simple-access-token';

      router.post('/ping', (req, res) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (token === ACCESS_TOKEN) {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
          return;
        }
        res.status(401).json({ error: 'Unauthorized' });
      });

      return runWithServer(app, port, async () => {
        // Simplest OAuth2 usage - just pass the access token
        const response = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          auth: {
            type: 'oauth2',
            accessToken: ACCESS_TOKEN
            // No flow, tokenUrl, clientId needed
          }
        });

        expect(response.data?.marshal()).toEqual(replyMessage.marshal());
      });
    });

    it('should handle missing access token gracefully', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});

      router.post('/ping', (req, res) => {
        // Should not have Authorization header since no token provided
        if (!req.headers.authorization) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        res.json({ success: true });
      });

      return runWithServer(app, port, async () => {
        try {
          // OAuth2 config without access token and no server-side flow
          await postPingPostRequest({
            payload: requestMessage,
            server: `http://localhost:${port}`,
            auth: {
              type: 'oauth2'
              // No accessToken, no flow - should make request without auth header
            }
          });
          throw new Error('Expected to fail');
        } catch (error) {
          expect(error.message).toBe('Unauthorized');
        }
      });
    });
  });
});
