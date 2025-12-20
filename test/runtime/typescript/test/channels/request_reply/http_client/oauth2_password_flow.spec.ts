/* eslint-disable no-console */
import { Ping } from "../../../../src/request-reply/payloads/Ping";
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import bodyParser from 'body-parser';
import { createTestServer, runWithServer, createTokenResponse, TestResponses } from './test-utils';
import { postPingPostRequest } from '../../../../src/request-reply/channels/http_client';

jest.setTimeout(10000);
describe('HTTP Client - OAuth2 Password Flow', () => {
  describe('OAuth2 Password Flow', () => {
    it('should authenticate with OAuth2 Password flow', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));
      
      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const CLIENT_ID = 'test-client-id';
      const CLIENT_SECRET = 'test-client-secret';
      const ACCESS_TOKEN = 'test-access-token-12345';
      const REFRESH_TOKEN = 'test-refresh-token-12345';
      const USERNAME = 'testuser';
      const PASSWORD = 'testpassword';

      // Mock token endpoint
      router.post('/oauth/token', (req, res) => {
        // Validate grant type
        if (req.body.grant_type !== 'password') {
          return res.status(400).json(TestResponses.badRequest('Invalid grant type').body);
        }
        
        // Validate client ID
        if (req.body.client_id !== CLIENT_ID) {
          return res.status(401).json(TestResponses.unauthorized('Invalid client credentials').body);
        }
        
        // Validate client secret if provided
        if (CLIENT_SECRET && req.body.client_secret !== CLIENT_SECRET) {
          return res.status(401).json(TestResponses.unauthorized('Invalid client credentials').body);
        }
        
        // Validate username and password
        if (req.body.username !== USERNAME || req.body.password !== PASSWORD) {
          return res.status(401).json(TestResponses.unauthorized('Invalid username or password').body);
        }
        
        // Return a successful token response
        res.json(createTokenResponse({
          accessToken: ACCESS_TOKEN,
          refreshToken: REFRESH_TOKEN,
          expiresIn: 3600
        }));
      });
      
      // Protected API endpoint that requires Bearer token
      router.post('/ping', (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json(TestResponses.unauthorized('Bearer Authentication Required').body);
        }
        
        // Validate the Bearer token
        const token = authHeader.split(' ')[1];
        if (token !== ACCESS_TOKEN) {
          return res.status(401).json(TestResponses.unauthorized('Invalid Token').body);
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });
      
      return runWithServer(app, port, async () => {
        // Mock onTokenRefresh callback
        const onTokenRefresh = jest.fn();
        
        const receivedReplyMessage = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          oauth2: {
            flow: 'password',
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            username: USERNAME,
            password: PASSWORD,
            tokenUrl: `http://localhost:${port}/oauth/token`,
            onTokenRefresh
          }
        });
        
        // Verify that the token refresh callback was called with the expected tokens
        expect(onTokenRefresh).toHaveBeenCalledWith({
          accessToken: ACCESS_TOKEN,
          refreshToken: REFRESH_TOKEN,
          expiresIn: 3600
        });
        
        expect(receivedReplyMessage?.marshal()).toEqual(replyMessage.marshal());
      });
    });
    
    it('should handle invalid username/password', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));
      
      const requestMessage = new Ping({});
      const CLIENT_ID = 'test-client-id';
      const INVALID_USERNAME = 'wronguser';
      const INVALID_PASSWORD = 'wrongpassword';

      // Mock token endpoint
      router.post('/oauth/token', (req, res) => {
        // Always return invalid grant for this test
        res.status(401).json({ 
          error: 'invalid_grant', 
          error_description: 'Invalid username or password' 
        });
      });
      
      return runWithServer(app, port, async () => {
        try {
          await postPingPostRequest({
            payload: requestMessage,
            server: `http://localhost:${port}`,
            oauth2: {
              flow: 'password',
              clientId: CLIENT_ID,
              username: INVALID_USERNAME,
              password: INVALID_PASSWORD,
              tokenUrl: `http://localhost:${port}/oauth/token`
            }
          });
          throw new Error('Expected request to fail with 401 status');
        } catch (error) {
          expect(error.message).toContain('OAuth2 token request failed');
        }
      });
    });
    
    it('should handle missing clientId in password flow', async () => {
      const port = Math.floor(Math.random() * (9875 - 5779 + 1)) + 5779;
      const requestMessage = new Ping({});
      const USERNAME = 'testuser';
      const PASSWORD = 'testpassword';
      
      try {
        // Using as any to bypass TypeScript's type checking for this test
        await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          oauth2: {
            flow: 'password',
            username: USERNAME,
            password: PASSWORD,
            tokenUrl: `http://localhost:${port}/oauth/token`
          } as any
        });
        throw new Error('Expected request to fail due to missing clientId');
      } catch (error) {
        expect(error.message).toBe('OAuth2 Password flow requires clientId');
      }
    });
    
    it('should handle password flow with scopes', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));
      
      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const CLIENT_ID = 'test-client-id';
      const ACCESS_TOKEN = 'test-access-token-12345';
      const USERNAME = 'testuser';
      const PASSWORD = 'testpassword';
      const SCOPES = ['read', 'write'];
      let receivedScopes = '';

      // Mock token endpoint
      router.post('/oauth/token', (req, res) => {
        // Validate grant type
        if (req.body.grant_type !== 'password') {
          return res.status(400).json(TestResponses.badRequest('Invalid grant type').body);
        }
        
        // Store the received scopes for later verification
        receivedScopes = req.body.scope;
        
        // Return a successful token response
        res.json(createTokenResponse({
          accessToken: ACCESS_TOKEN,
          expiresIn: 3600
        }));
      });
      
      // Protected API endpoint
      router.post('/ping', (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json(TestResponses.unauthorized('Bearer Authentication Required').body);
        }
        
        // Validate the Bearer token
        const token = authHeader.split(' ')[1];
        if (token !== ACCESS_TOKEN) {
          return res.status(401).json(TestResponses.unauthorized('Invalid Token').body);
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });
      
      return runWithServer(app, port, async () => {
        const receivedReplyMessage = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          oauth2: {
            flow: 'password',
            clientId: CLIENT_ID,
            username: USERNAME,
            password: PASSWORD,
            scopes: SCOPES,
            tokenUrl: `http://localhost:${port}/oauth/token`
          }
        });
        
        // Verify that the scopes were sent correctly
        expect(receivedScopes).toBe(SCOPES.join(' '));
        expect(receivedReplyMessage?.marshal()).toEqual(replyMessage.marshal());
      });
    });
  });
}); 