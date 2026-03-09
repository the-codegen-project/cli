/**
 * Extracts security scheme information from OpenAPI 2.0/3.x documents.
 * Converts security definitions to a normalized internal format.
 */
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';

/**
 * Normalized security scheme extracted from OpenAPI documents.
 * Supports OpenAPI 3.x securitySchemes and Swagger 2.0 securityDefinitions.
 */
export interface ExtractedSecurityScheme {
  /** The name/key of the security scheme as defined in the spec */
  name: string;
  /** Security scheme type */
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';

  /** For apiKey type: the name of the key parameter */
  apiKeyName?: string;
  /** For apiKey type: where to place the key */
  apiKeyIn?: 'header' | 'query' | 'cookie';

  /** For http type: the authentication scheme (bearer, basic, etc.) */
  httpScheme?: 'bearer' | 'basic' | string;
  /** For http bearer: the format of the bearer token */
  bearerFormat?: string;

  /** For oauth2 type: the available flows */
  oauth2Flows?: {
    implicit?: {
      authorizationUrl: string;
      scopes: Record<string, string>;
    };
    password?: {
      tokenUrl: string;
      scopes: Record<string, string>;
    };
    clientCredentials?: {
      tokenUrl: string;
      scopes: Record<string, string>;
    };
    authorizationCode?: {
      authorizationUrl: string;
      tokenUrl: string;
      scopes: Record<string, string>;
    };
  };

  /** For openIdConnect type: the OpenID Connect discovery URL */
  openIdConnectUrl?: string;
}

type OpenAPIDocument =
  | OpenAPIV3.Document
  | OpenAPIV2.Document
  | OpenAPIV3_1.Document;
type OpenAPIOperation =
  | OpenAPIV3.OperationObject
  | OpenAPIV2.OperationObject
  | OpenAPIV3_1.OperationObject;

/**
 * Extracts security schemes from an OpenAPI document.
 * Handles both OpenAPI 3.x (components.securitySchemes) and
 * Swagger 2.0 (securityDefinitions) formats.
 */
export function extractSecuritySchemes(
  document: OpenAPIDocument
): ExtractedSecurityScheme[] {
  // Check if OpenAPI 3.x document
  if ('openapi' in document) {
    return extractOpenAPI3SecuritySchemes(
      document as OpenAPIV3.Document | OpenAPIV3_1.Document
    );
  }

  // Check if Swagger 2.0 document
  if ('swagger' in document) {
    return extractSwagger2SecuritySchemes(document as OpenAPIV2.Document);
  }

  return [];
}

/**
 * Extracts security schemes from OpenAPI 3.x documents.
 */
function extractOpenAPI3SecuritySchemes(
  document: OpenAPIV3.Document | OpenAPIV3_1.Document
): ExtractedSecurityScheme[] {
  const securitySchemes = document.components?.securitySchemes;
  if (!securitySchemes) {
    return [];
  }

  const schemes: ExtractedSecurityScheme[] = [];

  for (const [name, scheme] of Object.entries(securitySchemes)) {
    // Skip $ref - should be dereferenced already
    if ('$ref' in scheme) {
      continue;
    }

    const securityScheme = scheme as OpenAPIV3.SecuritySchemeObject;
    const extracted = extractOpenAPI3Scheme(name, securityScheme);
    if (extracted) {
      schemes.push(extracted);
    }
  }

  return schemes;
}

/**
 * Extracts a single OpenAPI 3.x security scheme.
 */
function extractOpenAPI3Scheme(
  name: string,
  scheme: OpenAPIV3.SecuritySchemeObject
): ExtractedSecurityScheme | undefined {
  switch (scheme.type) {
    case 'apiKey':
      return {
        name,
        type: 'apiKey',
        apiKeyName: scheme.name,
        apiKeyIn: scheme.in as 'header' | 'query' | 'cookie'
      };

    case 'http':
      return {
        name,
        type: 'http',
        httpScheme: scheme.scheme as 'bearer' | 'basic',
        bearerFormat: scheme.bearerFormat
      };

    case 'oauth2':
      return {
        name,
        type: 'oauth2',
        oauth2Flows: extractOAuth2Flows(scheme.flows)
      };

    case 'openIdConnect':
      return {
        name,
        type: 'openIdConnect',
        openIdConnectUrl: scheme.openIdConnectUrl
      };

    default:
      return undefined;
  }
}

/**
 * Extracts OAuth2 flows from OpenAPI 3.x OAuth2 security scheme.
 */
function extractOAuth2Flows(
  flows: OpenAPIV3.OAuth2SecurityScheme['flows']
): ExtractedSecurityScheme['oauth2Flows'] {
  const result: ExtractedSecurityScheme['oauth2Flows'] = {};

  if (flows.implicit) {
    result.implicit = {
      authorizationUrl: flows.implicit.authorizationUrl,
      scopes: flows.implicit.scopes || {}
    };
  }

  if (flows.password) {
    result.password = {
      tokenUrl: flows.password.tokenUrl,
      scopes: flows.password.scopes || {}
    };
  }

  if (flows.clientCredentials) {
    result.clientCredentials = {
      tokenUrl: flows.clientCredentials.tokenUrl,
      scopes: flows.clientCredentials.scopes || {}
    };
  }

  if (flows.authorizationCode) {
    result.authorizationCode = {
      authorizationUrl: flows.authorizationCode.authorizationUrl,
      tokenUrl: flows.authorizationCode.tokenUrl,
      scopes: flows.authorizationCode.scopes || {}
    };
  }

  return result;
}

/**
 * Extracts security definitions from Swagger 2.0 documents.
 */
function extractSwagger2SecuritySchemes(
  document: OpenAPIV2.Document
): ExtractedSecurityScheme[] {
  const securityDefinitions = document.securityDefinitions;
  if (!securityDefinitions) {
    return [];
  }

  const schemes: ExtractedSecurityScheme[] = [];

  for (const [name, definition] of Object.entries(securityDefinitions)) {
    const extracted = extractSwagger2Scheme(name, definition);
    if (extracted) {
      schemes.push(extracted);
    }
  }

  return schemes;
}

/**
 * Extracts a single Swagger 2.0 security definition.
 */
function extractSwagger2Scheme(
  name: string,
  definition: OpenAPIV2.SecuritySchemeObject
): ExtractedSecurityScheme | undefined {
  switch (definition.type) {
    case 'apiKey':
      return {
        name,
        type: 'apiKey',
        apiKeyName: definition.name,
        apiKeyIn: definition.in as 'header' | 'query'
      };

    case 'basic':
      // Swagger 2.0 has a separate 'basic' type which maps to http basic
      return {
        name,
        type: 'http',
        httpScheme: 'basic'
      };

    case 'oauth2':
      return {
        name,
        type: 'oauth2',
        oauth2Flows: extractSwagger2OAuth2Flow(definition)
      };

    default:
      return undefined;
  }
}

/**
 * Extracts OAuth2 flow from Swagger 2.0 format.
 * Swagger 2.0 uses single 'flow' field instead of 'flows' object.
 */
function extractSwagger2OAuth2Flow(
  definition: OpenAPIV2.SecuritySchemeOauth2
): ExtractedSecurityScheme['oauth2Flows'] {
  const result: ExtractedSecurityScheme['oauth2Flows'] = {};
  const scopes = definition.scopes || {};

  switch (definition.flow) {
    case 'implicit':
      result.implicit = {
        authorizationUrl: definition.authorizationUrl || '',
        scopes
      };
      break;

    case 'password':
      result.password = {
        tokenUrl: definition.tokenUrl || '',
        scopes
      };
      break;

    case 'application':
      // Swagger 2.0 'application' maps to OpenAPI 3.x 'clientCredentials'
      result.clientCredentials = {
        tokenUrl: definition.tokenUrl || '',
        scopes
      };
      break;

    case 'accessCode':
      // Swagger 2.0 'accessCode' maps to OpenAPI 3.x 'authorizationCode'
      result.authorizationCode = {
        authorizationUrl: definition.authorizationUrl || '',
        tokenUrl: definition.tokenUrl || '',
        scopes
      };
      break;
  }

  return result;
}

