/* eslint-disable no-console */
import { Ping } from "../../../../src/request-reply/payloads/Ping";
import { createTestServer, runWithServer } from './test-utils';
import { postPingPostRequest } from '../../../../src/request-reply/channels/http_client';

jest.setTimeout(10000);
describe('HTTP Client - OAuth2 Implicit Flow', () => {
  describe('OAuth2 Implicit Flow', () => {
    it('should build proper authorization URL for implicit flow', async () => {
      const { app, port } = createTestServer();
      
      const requestMessage = new Ping({});
      const CLIENT_ID = 'test-client-id';
      const REDIRECT_URI = 'http://localhost:3000/callback';
      const AUTH_URL = 'http://localhost:3000/oauth/authorize';
      const SCOPES = ['read', 'write'];
      const STATE = 'random-state-value';
      let capturedAuthUrl = '';

      // Mock the implicit redirect handler
      const onImplicitRedirect = jest.fn((authUrl) => {
        capturedAuthUrl = authUrl;
        // In a real app, this would redirect the user to the authorization URL
      });

      return runWithServer(app, port, async () => {
        try {
          await postPingPostRequest({
            payload: requestMessage,
            server: `http://localhost:${port}`,
            oauth2: {
              flow: 'implicit',
              clientId: CLIENT_ID,
              redirectUri: REDIRECT_URI,
              authorizationUrl: AUTH_URL,
              scopes: SCOPES,
              state: STATE,
              responseType: 'token',
              onImplicitRedirect
            }
          });
          throw new Error('Expected request to throw since implicit flow requires redirect');
        } catch (error) {
          // Verify that the redirect handler was called
          expect(onImplicitRedirect).toHaveBeenCalled();

          // Verify that the authorization URL was constructed correctly
          const url = new URL(capturedAuthUrl);
          expect(url.origin + url.pathname).toBe(AUTH_URL);
          expect(url.searchParams.get('client_id')).toBe(CLIENT_ID);
          expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
          expect(url.searchParams.get('response_type')).toBe('token');
          expect(url.searchParams.get('state')).toBe(STATE);
          expect(url.searchParams.get('scope')).toBe(SCOPES.join(' '));

          // Verify the correct error message
          expect(error.message).toBe('OAuth2 Implicit flow redirect initiated');
        }
      });
    });

    it('should require clientId for implicit flow', async () => {
      const requestMessage = new Ping({});
      const AUTH_URL = 'http://localhost:3000/oauth/authorize';

      try {
        await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:1234`,
          oauth2: {
            flow: 'implicit',
            authorizationUrl: AUTH_URL,
            // Missing clientId
            onImplicitRedirect: jest.fn()
          } as any
        });
        throw new Error('Expected request to fail due to missing clientId');
      } catch (error) {
        expect(error.message).toBe('OAuth2 Implicit flow requires clientId');
      }
    });

    it('should require redirectUri for implicit flow', async () => {
      const requestMessage = new Ping({});
      const CLIENT_ID = 'test-client-id';
      const AUTH_URL = 'http://localhost:3000/oauth/authorize';

      try {
        await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:1234`,
          oauth2: {
            flow: 'implicit',
            clientId: CLIENT_ID,
            authorizationUrl: AUTH_URL,
            // Missing redirectUri
            onImplicitRedirect: jest.fn()
          }
        });
        throw new Error('Expected request to fail due to missing redirectUri');
      } catch (error) {
        expect(error.message).toBe('OAuth2 Implicit flow requires redirectUri');
      }
    });

    it('should require onImplicitRedirect handler for implicit flow', async () => {
      const requestMessage = new Ping({});
      const CLIENT_ID = 'test-client-id';
      const REDIRECT_URI = 'http://localhost:3000/callback';
      const AUTH_URL = 'http://localhost:3000/oauth/authorize';

      try {
        await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:12345`,
          oauth2: {
            flow: 'implicit',
            clientId: CLIENT_ID,
            redirectUri: REDIRECT_URI,
            authorizationUrl: AUTH_URL
            // Missing onImplicitRedirect handler
          }
        });
        throw new Error('Expected request to fail due to missing redirect handler');
      } catch (error) {
        expect(error.message).toBe('OAuth2 Implicit flow requires onImplicitRedirect handler');
      }
    });

    it('should support different response types for implicit flow', async () => {
      const { app, port } = createTestServer();

      const requestMessage = new Ping({});
      const CLIENT_ID = 'test-client-id';
      const REDIRECT_URI = 'http://localhost:3000/callback';
      const AUTH_URL = 'http://localhost:3000/oauth/authorize';
      const RESPONSE_TYPE = 'id_token token';
      let capturedAuthUrl = '';

      // Mock the implicit redirect handler
      const onImplicitRedirect = jest.fn((authUrl) => {
        capturedAuthUrl = authUrl;
      });

      return runWithServer(app, port, async () => {
        try {
          await postPingPostRequest({
            payload: requestMessage,
            server: `http://localhost:${port}`,
            oauth2: {
              flow: 'implicit',
              clientId: CLIENT_ID,
              redirectUri: REDIRECT_URI,
              authorizationUrl: AUTH_URL,
              responseType: RESPONSE_TYPE,
              onImplicitRedirect
            }
          });
          throw new Error('Expected request to throw since implicit flow requires redirect');
        } catch (error) {
          // Verify that the response_type was included correctly
          const url = new URL(capturedAuthUrl);
          expect(url.searchParams.get('response_type')).toBe(RESPONSE_TYPE);
        }
      });
    });
  });
}); 