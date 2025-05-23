/* eslint-disable no-console */
import { Protocols } from '../../../../src/request-reply/channels/index';
import { Ping } from "../../../../src/request-reply/payloads/Ping";
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import bodyParser from 'body-parser';
import { createTestServer, runWithServer, createTokenResponse, TestResponses } from './test-utils';
const { http_client } = Protocols;
const { postPingPostRequest } = http_client;

jest.setTimeout(10000);
describe('HTTP Client - OAuth2 Refresh Token Flow', () => {
  describe('OAuth2 Refresh Token', () => {
    it('should refresh token when receiving 401 with an expired token', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));
      
      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const CLIENT_ID = 'test-client-id';
      const CLIENT_SECRET = 'test-client-secret';
      const EXPIRED_ACCESS_TOKEN = 'expired-token-12345';
      const REFRESH_TOKEN = 'refresh-token-12345';
      const NEW_ACCESS_TOKEN = 'new-access-token-12345';
      const NEW_REFRESH_TOKEN = 'new-refresh-token-12345';
      let tokenRefreshCalled = false;

      // Mock token endpoint for refresh
      router.post('/oauth/token', (req, res) => {
        // Check if this is a refresh token request
        if (req.body.grant_type !== 'refresh_token') {
          return res.status(400).json(TestResponses.badRequest('Invalid grant type').body);
        }
        
        // Validate refresh token
        if (req.body.refresh_token !== REFRESH_TOKEN) {
          return res.status(401).json(TestResponses.unauthorized('Invalid refresh token').body);
        }
        
        // Validate client credentials
        if (req.body.client_id !== CLIENT_ID) {
          return res.status(401).json(TestResponses.unauthorized('Invalid client credentials').body);
        }
        
        if (CLIENT_SECRET && req.body.client_secret !== CLIENT_SECRET) {
          return res.status(401).json(TestResponses.unauthorized('Invalid client credentials').body);
        }
        
        tokenRefreshCalled = true;
        
        // Return a successful token response with a new access token and refresh token
        res.json(createTokenResponse({
          accessToken: NEW_ACCESS_TOKEN,
          refreshToken: NEW_REFRESH_TOKEN,
          expiresIn: 3600
        }));
      });
      
      // Protected API endpoint that requires Bearer token
      // First request will return 401, second request with refreshed token will succeed
      let requestCount = 0;
      router.post('/ping', (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json(TestResponses.unauthorized('Bearer Authentication Required').body);
        }
        
        // Get the token
        const token = authHeader.split(' ')[1];
        
        // First request with expired token returns 401
        if (requestCount === 0 && token === EXPIRED_ACCESS_TOKEN) {
          requestCount++;
          return res.status(401).json(TestResponses.unauthorized('Token Expired').body);
        }
        
        // Second request with new token should succeed
        if (requestCount === 1 && token === NEW_ACCESS_TOKEN) {
          requestCount++;
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
          return;
        }
        
        // Unexpected token
        res.status(401).json(TestResponses.unauthorized('Invalid Token').body);
      });
      
      return runWithServer(app, port, async () => {
        // Mock onTokenRefresh callback
        const onTokenRefresh = jest.fn();
        
        const receivedReplyMessage = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          oauth2: {
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            accessToken: EXPIRED_ACCESS_TOKEN,
            refreshToken: REFRESH_TOKEN,
            tokenUrl: `http://localhost:${port}/oauth/token`,
            onTokenRefresh
          }
        });
        
        // Verify that token refresh was called
        expect(tokenRefreshCalled).toBe(true);
        
        // Verify that the token refresh callback was called with the expected tokens
        expect(onTokenRefresh).toHaveBeenCalledWith({
          accessToken: NEW_ACCESS_TOKEN,
          refreshToken: NEW_REFRESH_TOKEN,
          expiresIn: 3600
        });
        
        // Verify that the request succeeded with the refreshed token
        expect(requestCount).toBe(2);
        expect(receivedReplyMessage?.marshal()).toEqual(replyMessage.marshal());
      });
    });
    
    it('should handle refresh token errors', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));
      
      const requestMessage = new Ping({});
      const CLIENT_ID = 'test-client-id';
      const EXPIRED_ACCESS_TOKEN = 'expired-token-12345';
      const INVALID_REFRESH_TOKEN = 'invalid-refresh-token';

      // Mock token endpoint that always fails refresh
      router.post('/oauth/token', (req, res) => {
        res.status(401).json(TestResponses.unauthorized('Invalid refresh token').body);
      });
      
      // Protected API endpoint that requires Bearer token
      router.post('/ping', (req, res) => {
        // Always return 401 for this test
        res.status(401).json(TestResponses.unauthorized('Token Expired').body);
      });
      
      return runWithServer(app, port, async () => {
        try {
          await postPingPostRequest({
            payload: requestMessage,
            server: `http://localhost:${port}`,
            oauth2: {
              clientId: CLIENT_ID,
              accessToken: EXPIRED_ACCESS_TOKEN,
              refreshToken: INVALID_REFRESH_TOKEN,
              tokenUrl: `http://localhost:${port}/oauth/token`
            }
          });
          throw new Error('Expected request to fail with 401 status');
        } catch (error) {
          // Request should fail with the original 401 error since refresh failed
          expect(error.message).toBe('Unauthorized');
        }
      });
    });
    
    it('should handle refresh token with missing required parameters', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));
      
      const requestMessage = new Ping({});
      const EXPIRED_ACCESS_TOKEN = 'expired-token-12345';
      // Missing clientId which is required for refresh

      // API endpoint that returns 401
      router.post('/ping', (req, res) => {
        res.status(401).json(TestResponses.unauthorized('Token Expired').body);
      });
      
      return runWithServer(app, port, async () => {
        try {
          await postPingPostRequest({
            payload: requestMessage,
            server: `http://localhost:${port}`,
            oauth2: {
              accessToken: EXPIRED_ACCESS_TOKEN,
              refreshToken: 'refresh-token',
              tokenUrl: `http://localhost:${port}/oauth/token`
            } as any // Using any to bypass type checking
          });
          throw new Error('Expected request to fail');
        } catch (error) {
          // The request should fail with the original 401 error
          // since refresh can't be performed without clientId
          expect(error.message).toBe('Unauthorized');
        }
      });
    });
    
    it('should preserve original refresh token if new one not returned', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));
      
      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const CLIENT_ID = 'test-client-id';
      const EXPIRED_ACCESS_TOKEN = 'expired-token-12345';
      const REFRESH_TOKEN = 'refresh-token-12345';
      const NEW_ACCESS_TOKEN = 'new-access-token-12345';
      // No new refresh token in the response
      
      // Mock token endpoint for refresh
      router.post('/oauth/token', (req, res) => {
        // Return a successful token response with only a new access token
        res.json(createTokenResponse({
          accessToken: NEW_ACCESS_TOKEN,
          expiresIn: 3600
          // No refresh token
        }));
      });
      
      // Protected API endpoint that requires Bearer token
      let requestCount = 0;
      router.post('/ping', (req, res) => {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        
        // First request with expired token returns 401
        if (requestCount === 0 && token === EXPIRED_ACCESS_TOKEN) {
          requestCount++;
          return res.status(401).json(TestResponses.unauthorized('Token Expired').body);
        }
        
        // Second request with new token should succeed
        if (requestCount === 1 && token === NEW_ACCESS_TOKEN) {
          requestCount++;
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });
      
      return runWithServer(app, port, async () => {
        // Mock onTokenRefresh callback
        const onTokenRefresh = jest.fn();
        
        const receivedReplyMessage = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          oauth2: {
            clientId: CLIENT_ID,
            accessToken: EXPIRED_ACCESS_TOKEN,
            refreshToken: REFRESH_TOKEN,
            tokenUrl: `http://localhost:${port}/oauth/token`,
            onTokenRefresh
          }
        });
        
        // Verify that the token refresh callback was called with the new access token
        // and the original refresh token preserved
        expect(onTokenRefresh).toHaveBeenCalledWith({
          accessToken: NEW_ACCESS_TOKEN,
          refreshToken: REFRESH_TOKEN, // Original refresh token preserved
          expiresIn: 3600
        });
        
        expect(receivedReplyMessage?.marshal()).toEqual(replyMessage.marshal());
      });
    });
  });
}); 