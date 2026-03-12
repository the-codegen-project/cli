import {
  renderHttpCommonTypes,
  SecuritySchemeOptions
} from '../../../../../../../src/codegen/generators/typescript/channels/protocols/http/fetch';

describe('HTTP Fetch Generator - Security Types', () => {
  describe('renderHttpCommonTypes with security schemes', () => {
    it('should generate only apiKey auth type when only apiKey scheme defined', () => {
      const securitySchemes: SecuritySchemeOptions[] = [
        {
          name: 'api_key',
          type: 'apiKey',
          apiKeyName: 'X-API-Key',
          apiKeyIn: 'header'
        }
      ];

      const result = renderHttpCommonTypes(securitySchemes);

      // Should include ApiKeyAuth interface
      expect(result).toContain('export interface ApiKeyAuth');
      expect(result).toContain("type: 'apiKey'");

      // Should include pre-populated values from the spec
      expect(result).toContain('X-API-Key');
      expect(result).toContain('header');

      // Should NOT include other auth types
      expect(result).not.toContain('export interface BearerAuth');
      expect(result).not.toContain('export interface BasicAuth');
      expect(result).not.toContain('export interface OAuth2Auth');

      // AuthConfig should only contain ApiKeyAuth
      expect(result).toContain('export type AuthConfig = ApiKeyAuth');
    });

    it('should generate only bearer auth type when http bearer scheme defined', () => {
      const securitySchemes: SecuritySchemeOptions[] = [
        {
          name: 'bearerAuth',
          type: 'http',
          httpScheme: 'bearer'
        }
      ];

      const result = renderHttpCommonTypes(securitySchemes);

      expect(result).toContain('export interface BearerAuth');
      expect(result).toContain("type: 'bearer'");
      expect(result).not.toContain('export interface ApiKeyAuth');
      expect(result).not.toContain('export interface BasicAuth');
      expect(result).not.toContain('export interface OAuth2Auth');
      expect(result).toContain('export type AuthConfig = BearerAuth');
    });

    it('should generate only basic auth type when http basic scheme defined', () => {
      const securitySchemes: SecuritySchemeOptions[] = [
        {
          name: 'basicAuth',
          type: 'http',
          httpScheme: 'basic'
        }
      ];

      const result = renderHttpCommonTypes(securitySchemes);

      expect(result).toContain('export interface BasicAuth');
      expect(result).toContain("type: 'basic'");
      expect(result).not.toContain('export interface BearerAuth');
      expect(result).not.toContain('export interface ApiKeyAuth');
      expect(result).not.toContain('export interface OAuth2Auth');
      expect(result).toContain('export type AuthConfig = BasicAuth');
    });

    it('should generate only oauth2 auth type when oauth2 scheme defined', () => {
      const securitySchemes: SecuritySchemeOptions[] = [
        {
          name: 'oauth2',
          type: 'oauth2',
          oauth2Flows: {
            clientCredentials: {
              tokenUrl: 'https://example.com/token',
              scopes: {read: 'read access'}
            }
          }
        }
      ];

      const result = renderHttpCommonTypes(securitySchemes);

      expect(result).toContain('export interface OAuth2Auth');
      expect(result).toContain("type: 'oauth2'");

      // Should include pre-populated tokenUrl from the spec
      expect(result).toContain('https://example.com/token');

      expect(result).not.toContain('export interface BearerAuth');
      expect(result).not.toContain('export interface BasicAuth');
      expect(result).not.toContain('export interface ApiKeyAuth');
      expect(result).toContain('export type AuthConfig = OAuth2Auth');
    });

    it('should generate multiple auth types when multiple schemes defined', () => {
      const securitySchemes: SecuritySchemeOptions[] = [
        {
          name: 'api_key',
          type: 'apiKey',
          apiKeyName: 'api_key',
          apiKeyIn: 'header'
        },
        {
          name: 'bearerAuth',
          type: 'http',
          httpScheme: 'bearer'
        }
      ];

      const result = renderHttpCommonTypes(securitySchemes);

      expect(result).toContain('export interface ApiKeyAuth');
      expect(result).toContain('export interface BearerAuth');
      expect(result).not.toContain('export interface BasicAuth');
      expect(result).not.toContain('export interface OAuth2Auth');

      // AuthConfig should be a union of the defined types
      expect(result).toMatch(/export type AuthConfig = (?:ApiKeyAuth \| BearerAuth|BearerAuth \| ApiKeyAuth)/);
    });

    it('should generate all auth types when no security schemes defined (backward compatibility)', () => {
      const result = renderHttpCommonTypes(); // No argument - backward compatible

      expect(result).toContain('export interface BearerAuth');
      expect(result).toContain('export interface BasicAuth');
      expect(result).toContain('export interface ApiKeyAuth');
      expect(result).toContain('export interface OAuth2Auth');
      expect(result).toContain(
        'export type AuthConfig = BearerAuth | BasicAuth | ApiKeyAuth | OAuth2Auth'
      );
    });

    it('should generate all auth types when empty security schemes array provided', () => {
      const result = renderHttpCommonTypes([]);

      expect(result).toContain('export interface BearerAuth');
      expect(result).toContain('export interface BasicAuth');
      expect(result).toContain('export interface ApiKeyAuth');
      expect(result).toContain('export interface OAuth2Auth');
    });

    it('should generate auth interface with pre-populated apiKey name and location', () => {
      const securitySchemes: SecuritySchemeOptions[] = [
        {
          name: 'petstore_api_key',
          type: 'apiKey',
          apiKeyName: 'X-Petstore-Key',
          apiKeyIn: 'query'
        }
      ];

      const result = renderHttpCommonTypes(securitySchemes);

      // The generated interface should have name and in pre-set
      expect(result).toContain('X-Petstore-Key');
      expect(result).toContain('query');
    });

    it('should generate OAuth2 auth with tokenUrl from implicit flow', () => {
      const securitySchemes: SecuritySchemeOptions[] = [
        {
          name: 'oauth2',
          type: 'oauth2',
          oauth2Flows: {
            implicit: {
              authorizationUrl: 'https://example.com/authorize',
              scopes: {}
            }
          }
        }
      ];

      const result = renderHttpCommonTypes(securitySchemes);

      expect(result).toContain('export interface OAuth2Auth');
      expect(result).toContain('https://example.com/authorize');
    });

    it('should handle openIdConnect type', () => {
      const securitySchemes: SecuritySchemeOptions[] = [
        {
          name: 'oidc',
          type: 'openIdConnect',
          openIdConnectUrl: 'https://example.com/.well-known/openid-configuration'
        }
      ];

      const result = renderHttpCommonTypes(securitySchemes);

      // OpenID Connect should be treated similar to OAuth2
      expect(result).toContain('export interface OAuth2Auth');
      expect(result).toContain('https://example.com/.well-known/openid-configuration');
    });

    it('should deduplicate auth types when same type defined multiple times', () => {
      const securitySchemes: SecuritySchemeOptions[] = [
        {
          name: 'api_key_header',
          type: 'apiKey',
          apiKeyName: 'X-API-Key',
          apiKeyIn: 'header'
        },
        {
          name: 'api_key_query',
          type: 'apiKey',
          apiKeyName: 'api_key',
          apiKeyIn: 'query'
        }
      ];

      const result = renderHttpCommonTypes(securitySchemes);

      // Should only have one ApiKeyAuth interface
      const apiKeyInterfaceMatches = result.match(/export interface ApiKeyAuth/g);
      expect(apiKeyInterfaceMatches).toHaveLength(1);

      // AuthConfig should still only have ApiKeyAuth once
      expect(result).toContain('export type AuthConfig = ApiKeyAuth');
      expect(result).not.toMatch(/ApiKeyAuth \| ApiKeyAuth/);
    });
  });
});
