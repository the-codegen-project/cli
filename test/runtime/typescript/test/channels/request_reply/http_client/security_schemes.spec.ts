/* eslint-disable no-console */
/**
 * Runtime tests for dynamically generated security types from OpenAPI securitySchemes.
 *
 * These tests verify that:
 * 1. Generated AuthConfig only contains auth types defined in the OpenAPI spec
 * 2. The narrowed types work correctly at runtime
 * 3. OAuth2 auth works with access tokens
 * 4. The generated code compiles and works correctly at runtime
 */
import {createTestServer, runWithServer} from './test-utils';
import {APet} from '../../../../src/openapi/payloads/APet';
import {
  postAddPet
} from '../../../../src/openapi/channels/http_client';

// Type-level test: Verify AuthConfig is narrowed to only defined types
// If this compiles, the types are correctly generated
type AssertAuthConfigHasOAuth2 = Extract<
  import('../../../../src/openapi/channels/http_client').AuthConfig,
  {type: 'oauth2'}
> extends never
  ? 'missing'
  : 'present';

type AssertAuthConfigHasApiKey = Extract<
  import('../../../../src/openapi/channels/http_client').AuthConfig,
  {type: 'apiKey'}
> extends never
  ? 'missing'
  : 'present';

// These should NOT exist if security schemes are properly extracted
type AssertAuthConfigMissingBasic = Extract<
  import('../../../../src/openapi/channels/http_client').AuthConfig,
  {type: 'basic'}
> extends never
  ? 'correctly-missing'
  : 'unexpectedly-present';

type AssertAuthConfigMissingBearer = Extract<
  import('../../../../src/openapi/channels/http_client').AuthConfig,
  {type: 'bearer'}
> extends never
  ? 'correctly-missing'
  : 'unexpectedly-present';

// Type assertions - these will fail at compile time if the types are wrong
const _assertOAuth2Present: AssertAuthConfigHasOAuth2 = 'present';
const _assertApiKeyPresent: AssertAuthConfigHasApiKey = 'present';
const _assertBasicMissing: AssertAuthConfigMissingBasic = 'correctly-missing';
const _assertBearerMissing: AssertAuthConfigMissingBearer = 'correctly-missing';

jest.setTimeout(15000);

describe('HTTP Client - Security Schemes from OpenAPI', () => {
  describe('apiKey authentication (api_key from spec)', () => {
    it('should allow apiKey auth type since it is in the spec', async () => {
      const {app, router, port} = createTestServer();

      const responsePet = new APet({
        id: 1,
        name: 'Fluffy',
        photoUrls: ['http://example.com/fluffy.jpg']
      });
      let receivedApiKey: string | undefined;

      // The spec defines: name: "api_key", in: "header"
      // The generated interface has this as the default in the comment
      router.post('/pet', (req, res) => {
        receivedApiKey = req.headers['x-api-key'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(responsePet.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const requestPet = new APet({
          name: 'Fluffy',
          photoUrls: ['http://example.com/fluffy.jpg']
        });

        // Use apiKey auth - users need to provide name/in but the defaults
        // from the spec are documented in the generated interface
        await postAddPet({
          payload: requestPet,
          server: `http://localhost:${port}`,
          auth: {
            type: 'apiKey',
            key: 'my-secret-api-key'
            // Uses default header name 'X-API-Key' when not specified
          }
        });

        expect(receivedApiKey).toBe('my-secret-api-key');
      });
    });

    it('should allow specifying custom apiKey name from spec', async () => {
      const {app, router, port} = createTestServer();

      const responsePet = new APet({
        id: 1,
        name: 'Fluffy',
        photoUrls: []
      });
      let receivedApiKey: string | undefined;

      // The spec defines: name: "api_key", in: "header"
      router.post('/pet', (req, res) => {
        receivedApiKey = req.headers['api_key'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(responsePet.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const requestPet = new APet({
          name: 'Fluffy',
          photoUrls: []
        });

        // Use the header name from the spec
        await postAddPet({
          payload: requestPet,
          server: `http://localhost:${port}`,
          auth: {
            type: 'apiKey',
            key: 'my-secret-api-key',
            name: 'api_key', // From spec: components.securitySchemes.api_key.name
            in: 'header'     // From spec: components.securitySchemes.api_key.in
          }
        });

        expect(receivedApiKey).toBe('my-secret-api-key');
      });
    });
  });

  describe('oauth2 authentication (petstore_auth from spec)', () => {
    it('should allow oauth2 auth type since it is in the spec', async () => {
      const {app, router, port} = createTestServer();

      const responsePet = new APet({
        id: 1,
        name: 'Fluffy',
        photoUrls: ['http://example.com/fluffy.jpg']
      });

      router.post('/pet', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.write(responsePet.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const requestPet = new APet({
          name: 'Fluffy',
          photoUrls: ['http://example.com/fluffy.jpg']
        });

        // With a pre-obtained token, oauth2 works
        const response = await postAddPet({
          payload: requestPet,
          server: `http://localhost:${port}`,
          auth: {
            type: 'oauth2',
            accessToken: 'pre-obtained-token'
          }
        });

        expect(response.status).toBe(200);
      });
    });

    it('should accept scopes as the spec defines them', async () => {
      const {app, router, port} = createTestServer();

      const responsePet = new APet({
        id: 1,
        name: 'Fluffy',
        photoUrls: []
      });

      router.post('/pet', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.write(responsePet.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const requestPet = new APet({
          name: 'Test',
          photoUrls: []
        });

        // The spec defines scopes: write:pets, read:pets
        // The generated interface documents these in the JSDoc
        await postAddPet({
          payload: requestPet,
          server: `http://localhost:${port}`,
          auth: {
            type: 'oauth2',
            accessToken: 'token',
            scopes: ['write:pets', 'read:pets']
          }
        });
      });
    });
  });

  describe('auth type narrowing', () => {
    it('should reject invalid auth types at compile time', async () => {
      // This test verifies at compile time that invalid auth types are rejected
      // If the security schemes are properly extracted, 'basic' and 'bearer'
      // should not be valid auth types for this OpenAPI spec
      //
      // The following commented code would cause a TypeScript error:
      //
      // await postAddPet({
      //   payload: requestPet,
      //   server: `http://localhost:${port}`,
      //   auth: { type: 'basic', username: 'user', password: 'pass' } // TypeScript Error!
      // });
      //
      // await postAddPet({
      //   payload: requestPet,
      //   server: `http://localhost:${port}`,
      //   auth: { type: 'bearer', token: 'token' } // TypeScript Error!
      // });

      expect(true).toBe(true); // Placeholder - the real test is at compile time
    });
  });
});
