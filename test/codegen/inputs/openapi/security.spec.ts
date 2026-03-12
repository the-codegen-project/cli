import {OpenAPIV3, OpenAPIV2} from 'openapi-types';
import {
  extractSecuritySchemes,
  SecuritySchemeOptions
} from '../../../../src/codegen/inputs/openapi/security';

describe('OpenAPI Security Extraction', () => {
  describe('extractSecuritySchemes', () => {
    describe('OpenAPI 3.x', () => {
      it('should extract apiKey security scheme from header', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              api_key: {
                type: 'apiKey',
                name: 'X-API-Key',
                in: 'header'
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0]).toEqual<SecuritySchemeOptions>({
          name: 'api_key',
          type: 'apiKey',
          apiKeyName: 'X-API-Key',
          apiKeyIn: 'header'
        });
      });

      it('should extract apiKey security scheme from query', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              api_key: {
                type: 'apiKey',
                name: 'api_key',
                in: 'query'
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0]).toEqual<SecuritySchemeOptions>({
          name: 'api_key',
          type: 'apiKey',
          apiKeyName: 'api_key',
          apiKeyIn: 'query'
        });
      });

      it('should extract apiKey security scheme from cookie', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              session: {
                type: 'apiKey',
                name: 'session_id',
                in: 'cookie'
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0]).toEqual<SecuritySchemeOptions>({
          name: 'session',
          type: 'apiKey',
          apiKeyName: 'session_id',
          apiKeyIn: 'cookie'
        });
      });

      it('should extract http bearer security scheme', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0]).toEqual<SecuritySchemeOptions>({
          name: 'bearerAuth',
          type: 'http',
          httpScheme: 'bearer',
          bearerFormat: 'JWT'
        });
      });

      it('should extract http basic security scheme', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              basicAuth: {
                type: 'http',
                scheme: 'basic'
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0]).toEqual<SecuritySchemeOptions>({
          name: 'basicAuth',
          type: 'http',
          httpScheme: 'basic'
        });
      });

      it('should extract oauth2 implicit flow', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              oauth2: {
                type: 'oauth2',
                flows: {
                  implicit: {
                    authorizationUrl: 'https://example.com/oauth/authorize',
                    scopes: {
                      'read:pets': 'read your pets',
                      'write:pets': 'modify pets in your account'
                    }
                  }
                }
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0]).toEqual<SecuritySchemeOptions>({
          name: 'oauth2',
          type: 'oauth2',
          oauth2Flows: {
            implicit: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              scopes: {
                'read:pets': 'read your pets',
                'write:pets': 'modify pets in your account'
              }
            }
          }
        });
      });

      it('should extract oauth2 authorization code flow', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              oauth2: {
                type: 'oauth2',
                flows: {
                  authorizationCode: {
                    authorizationUrl: 'https://example.com/oauth/authorize',
                    tokenUrl: 'https://example.com/oauth/token',
                    scopes: {
                      'read:users': 'read user data'
                    }
                  }
                }
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0].oauth2Flows?.authorizationCode).toEqual({
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': 'read user data'
          }
        });
      });

      it('should extract oauth2 client credentials flow', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              clientCredentials: {
                type: 'oauth2',
                flows: {
                  clientCredentials: {
                    tokenUrl: 'https://example.com/oauth/token',
                    scopes: {
                      admin: 'admin access'
                    }
                  }
                }
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0].oauth2Flows?.clientCredentials).toEqual({
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            admin: 'admin access'
          }
        });
      });

      it('should extract oauth2 password flow', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              passwordAuth: {
                type: 'oauth2',
                flows: {
                  password: {
                    tokenUrl: 'https://example.com/oauth/token',
                    scopes: {}
                  }
                }
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0].oauth2Flows?.password).toEqual({
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {}
        });
      });

      it('should extract openIdConnect security scheme', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              oidc: {
                type: 'openIdConnect',
                openIdConnectUrl:
                  'https://example.com/.well-known/openid-configuration'
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0]).toEqual<SecuritySchemeOptions>({
          name: 'oidc',
          type: 'openIdConnect',
          openIdConnectUrl:
            'https://example.com/.well-known/openid-configuration'
        });
      });

      it('should extract multiple security schemes', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {
            securitySchemes: {
              api_key: {
                type: 'apiKey',
                name: 'X-API-Key',
                in: 'header'
              },
              bearerAuth: {
                type: 'http',
                scheme: 'bearer'
              },
              oauth2: {
                type: 'oauth2',
                flows: {
                  implicit: {
                    authorizationUrl: 'https://example.com/oauth/authorize',
                    scopes: {}
                  }
                }
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(3);
        expect(schemes.map((s) => s.name)).toContain('api_key');
        expect(schemes.map((s) => s.name)).toContain('bearerAuth');
        expect(schemes.map((s) => s.name)).toContain('oauth2');
      });

      it('should return empty array when no security schemes defined', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {}
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toEqual([]);
      });

      it('should return empty array when components is empty', () => {
        const document: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          components: {}
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toEqual([]);
      });
    });

    describe('Swagger 2.0 (OpenAPI 2.0)', () => {
      it('should extract apiKey security definition from header', () => {
        const document: OpenAPIV2.Document = {
          swagger: '2.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          securityDefinitions: {
            api_key: {
              type: 'apiKey',
              name: 'api_key',
              in: 'header'
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0]).toEqual<SecuritySchemeOptions>({
          name: 'api_key',
          type: 'apiKey',
          apiKeyName: 'api_key',
          apiKeyIn: 'header'
        });
      });

      it('should extract basic security definition', () => {
        const document: OpenAPIV2.Document = {
          swagger: '2.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          securityDefinitions: {
            basicAuth: {
              type: 'basic'
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0]).toEqual<SecuritySchemeOptions>({
          name: 'basicAuth',
          type: 'http',
          httpScheme: 'basic'
        });
      });

      it('should extract oauth2 implicit flow from Swagger 2.0', () => {
        const document: OpenAPIV2.Document = {
          swagger: '2.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          securityDefinitions: {
            petstore_auth: {
              type: 'oauth2',
              flow: 'implicit',
              authorizationUrl: 'https://petstore.swagger.io/oauth/authorize',
              scopes: {
                'write:pets': 'modify pets',
                'read:pets': 'read pets'
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0]).toEqual<SecuritySchemeOptions>({
          name: 'petstore_auth',
          type: 'oauth2',
          oauth2Flows: {
            implicit: {
              authorizationUrl: 'https://petstore.swagger.io/oauth/authorize',
              scopes: {
                'write:pets': 'modify pets',
                'read:pets': 'read pets'
              }
            }
          }
        });
      });

      it('should extract oauth2 password flow from Swagger 2.0', () => {
        const document: OpenAPIV2.Document = {
          swagger: '2.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          securityDefinitions: {
            password_auth: {
              type: 'oauth2',
              flow: 'password',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {}
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0].oauth2Flows?.password).toEqual({
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {}
        });
      });

      it('should extract oauth2 application (client_credentials) flow from Swagger 2.0', () => {
        const document: OpenAPIV2.Document = {
          swagger: '2.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          securityDefinitions: {
            app_auth: {
              type: 'oauth2',
              flow: 'application',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {
                admin: 'admin access'
              }
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0].oauth2Flows?.clientCredentials).toEqual({
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            admin: 'admin access'
          }
        });
      });

      it('should extract oauth2 accessCode (authorization_code) flow from Swagger 2.0', () => {
        const document: OpenAPIV2.Document = {
          swagger: '2.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {},
          securityDefinitions: {
            code_auth: {
              type: 'oauth2',
              flow: 'accessCode',
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {}
            }
          }
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toHaveLength(1);
        expect(schemes[0].oauth2Flows?.authorizationCode).toEqual({
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {}
        });
      });

      it('should return empty array when no securityDefinitions in Swagger 2.0', () => {
        const document: OpenAPIV2.Document = {
          swagger: '2.0',
          info: {title: 'Test API', version: '1.0.0'},
          paths: {}
        };

        const schemes = extractSecuritySchemes(document);

        expect(schemes).toEqual([]);
      });
    });
  });
});
