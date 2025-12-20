/* eslint-disable no-console */
import { Ping } from "../../../../src/request-reply/payloads/Ping";
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import bodyParser from 'body-parser';
import { createTestServer, runWithServer, createTokenResponse, TestResponses } from './test-utils';
import { postPingPostRequest } from '../../../../src/request-reply/channels/http_client';

jest.setTimeout(10000);
describe('HTTP Client - OAuth2 Client Credentials Flow', () => {
  describe('OAuth2 Client Credentials', () => {
    it('should authenticate with OAuth2 Client Credentials flow', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));
      
      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const CLIENT_ID = 'test-client-id';
      const CLIENT_SECRET = 'test-client-secret';
      const ACCESS_TOKEN = 'test-access-token-12345';

      // Mock token endpoint
      router.post('/oauth/token', (req, res) => {
        // Validate grant type
        if (req.body.grant_type !== 'client_credentials') {
          return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid grant type' });
        }
        
        // Validate client credentials from body or Basic auth header
        const authHeader = req.headers.authorization;
        let clientId, clientSecret;
        
        if (authHeader && authHeader.startsWith('Basic ')) {
          // Extract credentials from Basic auth header
          const base64Credentials = authHeader.split(' ')[1];
          const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
          [clientId, clientSecret] = credentials.split(':');
        } else {
          // Extract credentials from request body
          clientId = req.body.client_id;
          clientSecret = req.body.client_secret;
        }
        
        if (clientId !== CLIENT_ID || (CLIENT_SECRET && clientSecret !== CLIENT_SECRET)) {
          return res.status(401).json({ error: 'invalid_client', error_description: 'Invalid client credentials' });
        }
        
        // Return a successful token response
        res.json(createTokenResponse({
          accessToken: ACCESS_TOKEN,
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
            flow: 'client_credentials',
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            tokenUrl: `http://localhost:${port}/oauth/token`,
            onTokenRefresh
          }
        });
        
        // Verify that the token refresh callback was called with the expected tokens
        expect(onTokenRefresh).toHaveBeenCalledWith({
          accessToken: ACCESS_TOKEN,
          refreshToken: undefined,
          expiresIn: 3600
        });
        
        expect(receivedReplyMessage?.marshal()).toEqual(replyMessage.marshal());
      });
    });
    
    it('should handle OAuth2 client credentials errors', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));
      
      const requestMessage = new Ping({});
      const CLIENT_ID = 'test-client-id';

      // Mock token endpoint that always fails
      router.post('/oauth/token', (req, res) => {
        res.status(401).json({ 
          error: 'invalid_client', 
          error_description: 'Invalid client credentials' 
        });
      });
      
      return runWithServer(app, port, async () => {
        try {
          await postPingPostRequest({
            payload: requestMessage,
            server: `http://localhost:${port}`,
            oauth2: {
              flow: 'client_credentials',
              clientId: CLIENT_ID,
              tokenUrl: `http://localhost:${port}/oauth/token`
            }
          });
          throw new Error('Expected request to fail with 401 status');
        } catch (error) {
          expect(error.message).toContain('OAuth2 token request failed');
        }
      });
    });
    
    it('should handle missing clientId in client credentials flow', async () => {
      const port = Math.floor(Math.random() * (9875 - 5779 + 1)) + 5779;
      const requestMessage = new Ping({});
      
      try {
        // Using as any to bypass TypeScript's type checking for this test
        await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          oauth2: {
            flow: 'client_credentials',
            tokenUrl: `http://localhost:${port}/oauth/token`
          } as any
        });
        throw new Error('Expected request to fail due to missing clientId');
      } catch (error) {
        expect(error.message).toBe('OAuth2 Client Credentials flow requires clientId');
      }
    });
    
    it('should handle client credentials with Basic authentication', async () => {
      const { app, router, port } = createTestServer();
      app.use(bodyParser.urlencoded({ extended: true }));
      
      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const CLIENT_ID = 'test-client-id';
      const CLIENT_SECRET = 'test-client-secret';
      const ACCESS_TOKEN = 'test-access-token-12345';
      let usedBasicAuth = false;

      // Mock token endpoint
      router.post('/oauth/token', (req, res) => {
        // Validate grant type
        if (req.body.grant_type !== 'client_credentials') {
          return res.status(400).json(TestResponses.badRequest('Invalid grant type').body);
        }
        
        // Check if Basic auth is used
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Basic ')) {
          usedBasicAuth = true;
          
          // Extract and validate credentials
          const base64Credentials = authHeader.split(' ')[1];
          const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
          const [clientId, clientSecret] = credentials.split(':');
          
          if (clientId !== CLIENT_ID || clientSecret !== CLIENT_SECRET) {
            return res.status(401).json(TestResponses.unauthorized('Invalid client credentials').body);
          }
        } else {
          // If not using Basic auth, client credentials should be in the request body
          return res.status(401).json(TestResponses.unauthorized('Basic authentication expected').body);
        }
        
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
            flow: 'client_credentials',
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            tokenUrl: `http://localhost:${port}/oauth/token`
          }
        });
        
        // Verify that Basic authentication was used
        expect(usedBasicAuth).toBe(true);
        expect(receivedReplyMessage?.marshal()).toEqual(replyMessage.marshal());
      });
    });
  });
}); 