/* eslint-disable no-console */
import { Protocols } from '../../../../src/request-reply/channels/index';
import { Ping } from "../../../../src/request-reply/payloads/Ping";
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import { createTestServer, runWithServer } from './test-utils';
const { http_client } = Protocols;
const { postPingPostRequest } = http_client;

jest.setTimeout(10000);
describe('HTTP Client - API Key and Basic Authentication', () => {
  describe('Authentication Methods', () => {
    it('should authenticate with API Key in header', async () => {
      const { app, router, port } = createTestServer();
      
      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const API_KEY = 'test-api-key-12345';
      const API_KEY_NAME = 'X-API-Key';

      router.post('/ping', (req, res) => {
        // Check if API key is present in the header
        if (req.headers[API_KEY_NAME.toLowerCase()] !== API_KEY) {
          return res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });
      
      return runWithServer(app, port, async () => {
        const receivedReplyMessage = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          apiKey: API_KEY,
          apiKeyName: API_KEY_NAME,
          apiKeyIn: 'header'
        });
        
        expect(receivedReplyMessage?.payload?.marshal()).toEqual(replyMessage.marshal());
      });
    });
    
    it('should authenticate with API Key in query parameter', async () => {
      const { app, router, port } = createTestServer();
      
      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const API_KEY = 'test-api-key-12345';
      const API_KEY_NAME = 'api_key';

      router.post('/ping', (req, res) => {
        // Check if API key is present in query params
        if (req.query[API_KEY_NAME] !== API_KEY) {
          return res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });
      
      return runWithServer(app, port, async () => {
        const receivedReplyMessage = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          apiKey: API_KEY,
          apiKeyName: API_KEY_NAME,
          apiKeyIn: 'query'
        });
        
        expect(receivedReplyMessage?.payload?.marshal()).toEqual(replyMessage.marshal());
      });
    });
    
    it('should authenticate with Basic Authentication', async () => {
      const { app, router, port } = createTestServer();
      
      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const USERNAME = 'testuser';
      const PASSWORD = 'testpassword';

      router.post('/ping', (req, res) => {
        // Check if Authorization header is present
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Basic ')) {
          return res.status(401).json({ error: 'Unauthorized - Basic Authentication Required' });
        }
        
        // Decode and validate the Basic auth credentials
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');
        
        if (username !== USERNAME || password !== PASSWORD) {
          return res.status(401).json({ error: 'Unauthorized - Invalid Credentials' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });
      
      return runWithServer(app, port, async () => {
        const receivedReplyMessage = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          username: USERNAME,
          password: PASSWORD
        });
        
        expect(receivedReplyMessage?.payload?.marshal()).toEqual(replyMessage.marshal());
      });
    });
    
    it('should authenticate with Bearer Token', async () => {
      const { app, router, port } = createTestServer();
      
      const requestMessage = new Ping({});
      const replyMessage = new Pong({additionalProperties: new Map([['test', true]])});
      const BEARER_TOKEN = 'jwt-token-12345';

      router.post('/ping', (req, res) => {
        // Check if Authorization header is present
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Unauthorized - Bearer Authentication Required' });
        }
        
        // Validate the Bearer token
        const token = authHeader.split(' ')[1];
        if (token !== BEARER_TOKEN) {
          return res.status(401).json({ error: 'Unauthorized - Invalid Token' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });
      
      return runWithServer(app, port, async () => {
        const receivedReplyMessage = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`,
          bearerToken: BEARER_TOKEN
        });
        
        expect(receivedReplyMessage?.payload?.marshal()).toEqual(replyMessage.marshal());
      });
    });
    
    it('should handle unauthorized errors with API Key', async () => {
      const { app, router, port } = createTestServer();
      
      const requestMessage = new Ping({});
      const API_KEY_NAME = 'X-API-Key';

      router.post('/ping', (req, res) => {
        // Always return unauthorized
        res.status(401);
        res.end();
      });
      
      return runWithServer(app, port, async () => {
        try {
          await postPingPostRequest({
            payload: requestMessage,
            server: `http://localhost:${port}`,
            apiKey: 'wrong-api-key',
            apiKeyName: API_KEY_NAME,
            apiKeyIn: 'header'
          });
          throw new Error('Expected request to fail with 401 status');
        } catch (error) {
          expect(error.message).toBe('Unauthorized');
        }
      });
    });
  });
}); 