import {Pong} from './../payloads/Pong';
import {Ping} from './../payloads/Ping';
import * as MultiStatusResponseReplyPayloadModule from './../payloads/MultiStatusResponseReplyPayload';
import * as PingPayloadModule from './../payloads/PingPayload';
import {NotFound} from './../payloads/NotFound';
import { URLSearchParams, URL } from 'url';
import * as NodeFetch from 'node-fetch';

async function postPingPostRequest(context: {
    server?: string;
    payload: Ping;
    path?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
    apiKey?: string; // API key value
    apiKeyName?: string; // Name of the API key parameter
    apiKeyIn?: 'header' | 'query'; // Where to place the API key (default: header)
    // OAuth2 parameters
    oauth2?: {
      clientId: string;
      clientSecret?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenUrl?: string;
      authorizationUrl?: string;
      redirectUri?: string;
      scopes?: string[];
      flow?: 'authorization_code' | 'implicit' | 'password' | 'client_credentials'; // Added flow parameter
      // For password flow
      username?: string; // Username for password flow
      password?: string; // Password for password flow
      onTokenRefresh?: (newTokens: { 
        accessToken: string; 
        refreshToken?: string; 
        expiresIn?: number;
      }) => void;
      // For Implicit flow
      responseType?: 'token' | 'id_token' | 'id_token token'; // For Implicit flow
      state?: string; // For security against CSRF
      onImplicitRedirect?: (authUrl: string) => void; // Callback for handling the redirect in Implicit flow
    };
    credentials?: RequestCredentials; //value for the credentials param we want to use on each request
    additionalHeaders?: Record<string, string | string[]>; //header params we want to use on every request,
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      credentials?: RequestCredentials,
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<Pong> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/ping',
      server: 'localhost:3000',
      apiKeyIn: 'header',
      apiKeyName: 'X-API-Key',
    },
    ...context,
  }

  // Validate parameters before proceeding with the request
  // OAuth2 Implicit flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit') {
    if (!parsedContext.oauth2.authorizationUrl) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires authorizationUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires clientId'));
    }
    if (!parsedContext.oauth2.redirectUri) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires redirectUri'));
    }
    if (!parsedContext.oauth2.onImplicitRedirect) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires onImplicitRedirect handler'));
    }
  }

  // OAuth2 Client Credentials flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires clientId'));
    }
  }

  // OAuth2 Password flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Password flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Password flow requires clientId'));
    }
    if (!parsedContext.oauth2.username) {
      return Promise.reject(new Error('OAuth2 Password flow requires username'));
    }
    if (!parsedContext.oauth2.password) {
      return Promise.reject(new Error('OAuth2 Password flow requires password'));
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.additionalHeaders
  };
  let url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  if (parsedContext.payload) {
    body = parsedContext.payload.marshal();
  }
  
  // Handle different authentication methods
  if (parsedContext.oauth2 && parsedContext.oauth2.accessToken) {
    // OAuth2 authentication with existing access token
    headers["Authorization"] = `Bearer ${parsedContext.oauth2.accessToken}`;
  } else if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit' && parsedContext.oauth2.authorizationUrl && parsedContext.oauth2.onImplicitRedirect) {
    // Build the authorization URL for implicit flow
    const authUrl = new URL(parsedContext.oauth2.authorizationUrl);
    authUrl.searchParams.append('client_id', parsedContext.oauth2.clientId);
    authUrl.searchParams.append('redirect_uri', parsedContext.oauth2.redirectUri!);
    authUrl.searchParams.append('response_type', parsedContext.oauth2.responseType || 'token');
    
    if (parsedContext.oauth2.state) {
      authUrl.searchParams.append('state', parsedContext.oauth2.state);
    }
    
    if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
      authUrl.searchParams.append('scope', parsedContext.oauth2.scopes.join(' '));
    }
    
    // Call the redirect handler
    parsedContext.oauth2.onImplicitRedirect(authUrl.toString());
    // Since we've initiated a redirect flow, we can't continue with the request
    // The application will need to handle the redirect and subsequent token extraction
    return Promise.reject(new Error('OAuth2 Implicit flow redirect initiated'));
  } else if (parsedContext.bearerToken) {
    // bearer authentication
    headers["Authorization"] = `Bearer ${parsedContext.bearerToken}`;
  } else if (parsedContext.username && parsedContext.password) {
    // basic authentication
    const credentials = Buffer.from(`${parsedContext.username}:${parsedContext.password}`).toString('base64');
    headers["Authorization"] = `Basic ${credentials}`;
  }
  
  // API Key Authentication
  if (parsedContext.apiKey) {
    if (parsedContext.apiKeyIn === 'header') {
      // Add API key to headers
      headers[parsedContext.apiKeyName] = parsedContext.apiKey;
    } else if (parsedContext.apiKeyIn === 'query') {
      // Add API key to query parameters
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${parsedContext.apiKeyName}=${encodeURIComponent(parsedContext.apiKey)}`;
    }
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({url,
    method: 'POST',
    headers,
    body
  });	

  // Handle OAuth2 Client Credentials flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: parsedContext.oauth2.clientId
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      // Some APIs use basic auth with client credentials instead of form params
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // If both client ID and secret are provided, some servers prefer basic auth
      if (parsedContext.oauth2.clientId && parsedContext.oauth2.clientSecret) {
        const credentials = Buffer.from(
          `${parsedContext.oauth2.clientId}:${parsedContext.oauth2.clientSecret}`
        ).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
        // Remove client_id and client_secret from the request body when using basic auth
        params.delete('client_id');
        params.delete('client_secret');
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: authHeaders,
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "POST",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 Client Credentials flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle OAuth2 password flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'password',
        username: parsedContext.oauth2.username || '',
        password: parsedContext.oauth2.password || '',
        client_id: parsedContext.oauth2.clientId,
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "POST",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);

      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 password flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle token refresh for OAuth2 if we get a 401
  if (response.status === 401 && parsedContext.oauth2 && parsedContext.oauth2.refreshToken && parsedContext.oauth2.tokenUrl && parsedContext.oauth2.clientId) {
    try {
      const refreshResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: parsedContext.oauth2.refreshToken,
          client_id: parsedContext.oauth2.clientId,
          ...(parsedContext.oauth2.clientSecret ? { client_secret: parsedContext.oauth2.clientSecret } : {})
        }).toString()
      });
      
      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        const newTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || parsedContext.oauth2.refreshToken,
          expiresIn: tokenData.expires_in
        };
        
        // Update the access token for this request
        headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        
        // Notify the client about the refreshed tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(newTokens);
        }
        
        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "POST",
          headers,
          body
        });
        
        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        // Token refresh failed, return a standardized error message
        return Promise.reject(new Error('Unauthorized'));
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // For any error during refresh, return a standardized error message
      return Promise.reject(new Error('Unauthorized'));
    }
  }
  
  // Handle error status codes before attempting to parse JSON
  if (!response.ok) {
    // For multi-status responses (with replyMessageModule), let unmarshalByStatusCode handle the parsing
    // Only throw standardized errors for simple responses or when JSON parsing fails
    // Handle common HTTP error codes with standardized messages
    if (response.status === 401) {
      return Promise.reject(new Error('Unauthorized'));
    } else if (response.status === 403) {
      return Promise.reject(new Error('Forbidden'));
    } else if (response.status === 404) {
      return Promise.reject(new Error('Not Found'));
    } else if (response.status === 500) {
      return Promise.reject(new Error('Internal Server Error'));
    } else {
      return Promise.reject(new Error(`HTTP Error: ${response.status} ${response.statusText}`));
    }
  }
  
  const data = await response.json();
  return Pong.unmarshal(data);
}

async function getPingGetRequest(context: {
    server?: string;
    
    path?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
    apiKey?: string; // API key value
    apiKeyName?: string; // Name of the API key parameter
    apiKeyIn?: 'header' | 'query'; // Where to place the API key (default: header)
    // OAuth2 parameters
    oauth2?: {
      clientId: string;
      clientSecret?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenUrl?: string;
      authorizationUrl?: string;
      redirectUri?: string;
      scopes?: string[];
      flow?: 'authorization_code' | 'implicit' | 'password' | 'client_credentials'; // Added flow parameter
      // For password flow
      username?: string; // Username for password flow
      password?: string; // Password for password flow
      onTokenRefresh?: (newTokens: { 
        accessToken: string; 
        refreshToken?: string; 
        expiresIn?: number;
      }) => void;
      // For Implicit flow
      responseType?: 'token' | 'id_token' | 'id_token token'; // For Implicit flow
      state?: string; // For security against CSRF
      onImplicitRedirect?: (authUrl: string) => void; // Callback for handling the redirect in Implicit flow
    };
    credentials?: RequestCredentials; //value for the credentials param we want to use on each request
    additionalHeaders?: Record<string, string | string[]>; //header params we want to use on every request,
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      credentials?: RequestCredentials,
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<Pong> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/ping',
      server: 'localhost:3000',
      apiKeyIn: 'header',
      apiKeyName: 'X-API-Key',
    },
    ...context,
  }

  // Validate parameters before proceeding with the request
  // OAuth2 Implicit flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit') {
    if (!parsedContext.oauth2.authorizationUrl) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires authorizationUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires clientId'));
    }
    if (!parsedContext.oauth2.redirectUri) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires redirectUri'));
    }
    if (!parsedContext.oauth2.onImplicitRedirect) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires onImplicitRedirect handler'));
    }
  }

  // OAuth2 Client Credentials flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires clientId'));
    }
  }

  // OAuth2 Password flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Password flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Password flow requires clientId'));
    }
    if (!parsedContext.oauth2.username) {
      return Promise.reject(new Error('OAuth2 Password flow requires username'));
    }
    if (!parsedContext.oauth2.password) {
      return Promise.reject(new Error('OAuth2 Password flow requires password'));
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.additionalHeaders
  };
  let url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  
  
  // Handle different authentication methods
  if (parsedContext.oauth2 && parsedContext.oauth2.accessToken) {
    // OAuth2 authentication with existing access token
    headers["Authorization"] = `Bearer ${parsedContext.oauth2.accessToken}`;
  } else if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit' && parsedContext.oauth2.authorizationUrl && parsedContext.oauth2.onImplicitRedirect) {
    // Build the authorization URL for implicit flow
    const authUrl = new URL(parsedContext.oauth2.authorizationUrl);
    authUrl.searchParams.append('client_id', parsedContext.oauth2.clientId);
    authUrl.searchParams.append('redirect_uri', parsedContext.oauth2.redirectUri!);
    authUrl.searchParams.append('response_type', parsedContext.oauth2.responseType || 'token');
    
    if (parsedContext.oauth2.state) {
      authUrl.searchParams.append('state', parsedContext.oauth2.state);
    }
    
    if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
      authUrl.searchParams.append('scope', parsedContext.oauth2.scopes.join(' '));
    }
    
    // Call the redirect handler
    parsedContext.oauth2.onImplicitRedirect(authUrl.toString());
    // Since we've initiated a redirect flow, we can't continue with the request
    // The application will need to handle the redirect and subsequent token extraction
    return Promise.reject(new Error('OAuth2 Implicit flow redirect initiated'));
  } else if (parsedContext.bearerToken) {
    // bearer authentication
    headers["Authorization"] = `Bearer ${parsedContext.bearerToken}`;
  } else if (parsedContext.username && parsedContext.password) {
    // basic authentication
    const credentials = Buffer.from(`${parsedContext.username}:${parsedContext.password}`).toString('base64');
    headers["Authorization"] = `Basic ${credentials}`;
  }
  
  // API Key Authentication
  if (parsedContext.apiKey) {
    if (parsedContext.apiKeyIn === 'header') {
      // Add API key to headers
      headers[parsedContext.apiKeyName] = parsedContext.apiKey;
    } else if (parsedContext.apiKeyIn === 'query') {
      // Add API key to query parameters
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${parsedContext.apiKeyName}=${encodeURIComponent(parsedContext.apiKey)}`;
    }
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({url,
    method: 'GET',
    headers,
    body
  });	

  // Handle OAuth2 Client Credentials flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: parsedContext.oauth2.clientId
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      // Some APIs use basic auth with client credentials instead of form params
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // If both client ID and secret are provided, some servers prefer basic auth
      if (parsedContext.oauth2.clientId && parsedContext.oauth2.clientSecret) {
        const credentials = Buffer.from(
          `${parsedContext.oauth2.clientId}:${parsedContext.oauth2.clientSecret}`
        ).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
        // Remove client_id and client_secret from the request body when using basic auth
        params.delete('client_id');
        params.delete('client_secret');
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: authHeaders,
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "GET",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 Client Credentials flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle OAuth2 password flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'password',
        username: parsedContext.oauth2.username || '',
        password: parsedContext.oauth2.password || '',
        client_id: parsedContext.oauth2.clientId,
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "GET",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);

      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 password flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle token refresh for OAuth2 if we get a 401
  if (response.status === 401 && parsedContext.oauth2 && parsedContext.oauth2.refreshToken && parsedContext.oauth2.tokenUrl && parsedContext.oauth2.clientId) {
    try {
      const refreshResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: parsedContext.oauth2.refreshToken,
          client_id: parsedContext.oauth2.clientId,
          ...(parsedContext.oauth2.clientSecret ? { client_secret: parsedContext.oauth2.clientSecret } : {})
        }).toString()
      });
      
      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        const newTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || parsedContext.oauth2.refreshToken,
          expiresIn: tokenData.expires_in
        };
        
        // Update the access token for this request
        headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        
        // Notify the client about the refreshed tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(newTokens);
        }
        
        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "GET",
          headers,
          body
        });
        
        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        // Token refresh failed, return a standardized error message
        return Promise.reject(new Error('Unauthorized'));
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // For any error during refresh, return a standardized error message
      return Promise.reject(new Error('Unauthorized'));
    }
  }
  
  // Handle error status codes before attempting to parse JSON
  if (!response.ok) {
    // For multi-status responses (with replyMessageModule), let unmarshalByStatusCode handle the parsing
    // Only throw standardized errors for simple responses or when JSON parsing fails
    // Handle common HTTP error codes with standardized messages
    if (response.status === 401) {
      return Promise.reject(new Error('Unauthorized'));
    } else if (response.status === 403) {
      return Promise.reject(new Error('Forbidden'));
    } else if (response.status === 404) {
      return Promise.reject(new Error('Not Found'));
    } else if (response.status === 500) {
      return Promise.reject(new Error('Internal Server Error'));
    } else {
      return Promise.reject(new Error(`HTTP Error: ${response.status} ${response.statusText}`));
    }
  }
  
  const data = await response.json();
  return Pong.unmarshal(data);
}

async function putPingPutRequest(context: {
    server?: string;
    
    path?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
    apiKey?: string; // API key value
    apiKeyName?: string; // Name of the API key parameter
    apiKeyIn?: 'header' | 'query'; // Where to place the API key (default: header)
    // OAuth2 parameters
    oauth2?: {
      clientId: string;
      clientSecret?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenUrl?: string;
      authorizationUrl?: string;
      redirectUri?: string;
      scopes?: string[];
      flow?: 'authorization_code' | 'implicit' | 'password' | 'client_credentials'; // Added flow parameter
      // For password flow
      username?: string; // Username for password flow
      password?: string; // Password for password flow
      onTokenRefresh?: (newTokens: { 
        accessToken: string; 
        refreshToken?: string; 
        expiresIn?: number;
      }) => void;
      // For Implicit flow
      responseType?: 'token' | 'id_token' | 'id_token token'; // For Implicit flow
      state?: string; // For security against CSRF
      onImplicitRedirect?: (authUrl: string) => void; // Callback for handling the redirect in Implicit flow
    };
    credentials?: RequestCredentials; //value for the credentials param we want to use on each request
    additionalHeaders?: Record<string, string | string[]>; //header params we want to use on every request,
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      credentials?: RequestCredentials,
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<Pong> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/ping',
      server: 'localhost:3000',
      apiKeyIn: 'header',
      apiKeyName: 'X-API-Key',
    },
    ...context,
  }

  // Validate parameters before proceeding with the request
  // OAuth2 Implicit flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit') {
    if (!parsedContext.oauth2.authorizationUrl) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires authorizationUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires clientId'));
    }
    if (!parsedContext.oauth2.redirectUri) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires redirectUri'));
    }
    if (!parsedContext.oauth2.onImplicitRedirect) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires onImplicitRedirect handler'));
    }
  }

  // OAuth2 Client Credentials flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires clientId'));
    }
  }

  // OAuth2 Password flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Password flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Password flow requires clientId'));
    }
    if (!parsedContext.oauth2.username) {
      return Promise.reject(new Error('OAuth2 Password flow requires username'));
    }
    if (!parsedContext.oauth2.password) {
      return Promise.reject(new Error('OAuth2 Password flow requires password'));
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.additionalHeaders
  };
  let url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  
  
  // Handle different authentication methods
  if (parsedContext.oauth2 && parsedContext.oauth2.accessToken) {
    // OAuth2 authentication with existing access token
    headers["Authorization"] = `Bearer ${parsedContext.oauth2.accessToken}`;
  } else if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit' && parsedContext.oauth2.authorizationUrl && parsedContext.oauth2.onImplicitRedirect) {
    // Build the authorization URL for implicit flow
    const authUrl = new URL(parsedContext.oauth2.authorizationUrl);
    authUrl.searchParams.append('client_id', parsedContext.oauth2.clientId);
    authUrl.searchParams.append('redirect_uri', parsedContext.oauth2.redirectUri!);
    authUrl.searchParams.append('response_type', parsedContext.oauth2.responseType || 'token');
    
    if (parsedContext.oauth2.state) {
      authUrl.searchParams.append('state', parsedContext.oauth2.state);
    }
    
    if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
      authUrl.searchParams.append('scope', parsedContext.oauth2.scopes.join(' '));
    }
    
    // Call the redirect handler
    parsedContext.oauth2.onImplicitRedirect(authUrl.toString());
    // Since we've initiated a redirect flow, we can't continue with the request
    // The application will need to handle the redirect and subsequent token extraction
    return Promise.reject(new Error('OAuth2 Implicit flow redirect initiated'));
  } else if (parsedContext.bearerToken) {
    // bearer authentication
    headers["Authorization"] = `Bearer ${parsedContext.bearerToken}`;
  } else if (parsedContext.username && parsedContext.password) {
    // basic authentication
    const credentials = Buffer.from(`${parsedContext.username}:${parsedContext.password}`).toString('base64');
    headers["Authorization"] = `Basic ${credentials}`;
  }
  
  // API Key Authentication
  if (parsedContext.apiKey) {
    if (parsedContext.apiKeyIn === 'header') {
      // Add API key to headers
      headers[parsedContext.apiKeyName] = parsedContext.apiKey;
    } else if (parsedContext.apiKeyIn === 'query') {
      // Add API key to query parameters
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${parsedContext.apiKeyName}=${encodeURIComponent(parsedContext.apiKey)}`;
    }
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({url,
    method: 'PUT',
    headers,
    body
  });	

  // Handle OAuth2 Client Credentials flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: parsedContext.oauth2.clientId
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      // Some APIs use basic auth with client credentials instead of form params
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // If both client ID and secret are provided, some servers prefer basic auth
      if (parsedContext.oauth2.clientId && parsedContext.oauth2.clientSecret) {
        const credentials = Buffer.from(
          `${parsedContext.oauth2.clientId}:${parsedContext.oauth2.clientSecret}`
        ).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
        // Remove client_id and client_secret from the request body when using basic auth
        params.delete('client_id');
        params.delete('client_secret');
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: authHeaders,
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "PUT",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 Client Credentials flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle OAuth2 password flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'password',
        username: parsedContext.oauth2.username || '',
        password: parsedContext.oauth2.password || '',
        client_id: parsedContext.oauth2.clientId,
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "PUT",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);

      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 password flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle token refresh for OAuth2 if we get a 401
  if (response.status === 401 && parsedContext.oauth2 && parsedContext.oauth2.refreshToken && parsedContext.oauth2.tokenUrl && parsedContext.oauth2.clientId) {
    try {
      const refreshResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: parsedContext.oauth2.refreshToken,
          client_id: parsedContext.oauth2.clientId,
          ...(parsedContext.oauth2.clientSecret ? { client_secret: parsedContext.oauth2.clientSecret } : {})
        }).toString()
      });
      
      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        const newTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || parsedContext.oauth2.refreshToken,
          expiresIn: tokenData.expires_in
        };
        
        // Update the access token for this request
        headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        
        // Notify the client about the refreshed tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(newTokens);
        }
        
        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "PUT",
          headers,
          body
        });
        
        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        // Token refresh failed, return a standardized error message
        return Promise.reject(new Error('Unauthorized'));
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // For any error during refresh, return a standardized error message
      return Promise.reject(new Error('Unauthorized'));
    }
  }
  
  // Handle error status codes before attempting to parse JSON
  if (!response.ok) {
    // For multi-status responses (with replyMessageModule), let unmarshalByStatusCode handle the parsing
    // Only throw standardized errors for simple responses or when JSON parsing fails
    // Handle common HTTP error codes with standardized messages
    if (response.status === 401) {
      return Promise.reject(new Error('Unauthorized'));
    } else if (response.status === 403) {
      return Promise.reject(new Error('Forbidden'));
    } else if (response.status === 404) {
      return Promise.reject(new Error('Not Found'));
    } else if (response.status === 500) {
      return Promise.reject(new Error('Internal Server Error'));
    } else {
      return Promise.reject(new Error(`HTTP Error: ${response.status} ${response.statusText}`));
    }
  }
  
  const data = await response.json();
  return Pong.unmarshal(data);
}

async function deletePingDeleteRequest(context: {
    server?: string;
    
    path?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
    apiKey?: string; // API key value
    apiKeyName?: string; // Name of the API key parameter
    apiKeyIn?: 'header' | 'query'; // Where to place the API key (default: header)
    // OAuth2 parameters
    oauth2?: {
      clientId: string;
      clientSecret?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenUrl?: string;
      authorizationUrl?: string;
      redirectUri?: string;
      scopes?: string[];
      flow?: 'authorization_code' | 'implicit' | 'password' | 'client_credentials'; // Added flow parameter
      // For password flow
      username?: string; // Username for password flow
      password?: string; // Password for password flow
      onTokenRefresh?: (newTokens: { 
        accessToken: string; 
        refreshToken?: string; 
        expiresIn?: number;
      }) => void;
      // For Implicit flow
      responseType?: 'token' | 'id_token' | 'id_token token'; // For Implicit flow
      state?: string; // For security against CSRF
      onImplicitRedirect?: (authUrl: string) => void; // Callback for handling the redirect in Implicit flow
    };
    credentials?: RequestCredentials; //value for the credentials param we want to use on each request
    additionalHeaders?: Record<string, string | string[]>; //header params we want to use on every request,
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      credentials?: RequestCredentials,
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<Pong> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/ping',
      server: 'localhost:3000',
      apiKeyIn: 'header',
      apiKeyName: 'X-API-Key',
    },
    ...context,
  }

  // Validate parameters before proceeding with the request
  // OAuth2 Implicit flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit') {
    if (!parsedContext.oauth2.authorizationUrl) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires authorizationUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires clientId'));
    }
    if (!parsedContext.oauth2.redirectUri) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires redirectUri'));
    }
    if (!parsedContext.oauth2.onImplicitRedirect) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires onImplicitRedirect handler'));
    }
  }

  // OAuth2 Client Credentials flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires clientId'));
    }
  }

  // OAuth2 Password flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Password flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Password flow requires clientId'));
    }
    if (!parsedContext.oauth2.username) {
      return Promise.reject(new Error('OAuth2 Password flow requires username'));
    }
    if (!parsedContext.oauth2.password) {
      return Promise.reject(new Error('OAuth2 Password flow requires password'));
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.additionalHeaders
  };
  let url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  
  
  // Handle different authentication methods
  if (parsedContext.oauth2 && parsedContext.oauth2.accessToken) {
    // OAuth2 authentication with existing access token
    headers["Authorization"] = `Bearer ${parsedContext.oauth2.accessToken}`;
  } else if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit' && parsedContext.oauth2.authorizationUrl && parsedContext.oauth2.onImplicitRedirect) {
    // Build the authorization URL for implicit flow
    const authUrl = new URL(parsedContext.oauth2.authorizationUrl);
    authUrl.searchParams.append('client_id', parsedContext.oauth2.clientId);
    authUrl.searchParams.append('redirect_uri', parsedContext.oauth2.redirectUri!);
    authUrl.searchParams.append('response_type', parsedContext.oauth2.responseType || 'token');
    
    if (parsedContext.oauth2.state) {
      authUrl.searchParams.append('state', parsedContext.oauth2.state);
    }
    
    if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
      authUrl.searchParams.append('scope', parsedContext.oauth2.scopes.join(' '));
    }
    
    // Call the redirect handler
    parsedContext.oauth2.onImplicitRedirect(authUrl.toString());
    // Since we've initiated a redirect flow, we can't continue with the request
    // The application will need to handle the redirect and subsequent token extraction
    return Promise.reject(new Error('OAuth2 Implicit flow redirect initiated'));
  } else if (parsedContext.bearerToken) {
    // bearer authentication
    headers["Authorization"] = `Bearer ${parsedContext.bearerToken}`;
  } else if (parsedContext.username && parsedContext.password) {
    // basic authentication
    const credentials = Buffer.from(`${parsedContext.username}:${parsedContext.password}`).toString('base64');
    headers["Authorization"] = `Basic ${credentials}`;
  }
  
  // API Key Authentication
  if (parsedContext.apiKey) {
    if (parsedContext.apiKeyIn === 'header') {
      // Add API key to headers
      headers[parsedContext.apiKeyName] = parsedContext.apiKey;
    } else if (parsedContext.apiKeyIn === 'query') {
      // Add API key to query parameters
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${parsedContext.apiKeyName}=${encodeURIComponent(parsedContext.apiKey)}`;
    }
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({url,
    method: 'DELETE',
    headers,
    body
  });	

  // Handle OAuth2 Client Credentials flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: parsedContext.oauth2.clientId
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      // Some APIs use basic auth with client credentials instead of form params
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // If both client ID and secret are provided, some servers prefer basic auth
      if (parsedContext.oauth2.clientId && parsedContext.oauth2.clientSecret) {
        const credentials = Buffer.from(
          `${parsedContext.oauth2.clientId}:${parsedContext.oauth2.clientSecret}`
        ).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
        // Remove client_id and client_secret from the request body when using basic auth
        params.delete('client_id');
        params.delete('client_secret');
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: authHeaders,
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "DELETE",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 Client Credentials flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle OAuth2 password flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'password',
        username: parsedContext.oauth2.username || '',
        password: parsedContext.oauth2.password || '',
        client_id: parsedContext.oauth2.clientId,
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "DELETE",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);

      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 password flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle token refresh for OAuth2 if we get a 401
  if (response.status === 401 && parsedContext.oauth2 && parsedContext.oauth2.refreshToken && parsedContext.oauth2.tokenUrl && parsedContext.oauth2.clientId) {
    try {
      const refreshResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: parsedContext.oauth2.refreshToken,
          client_id: parsedContext.oauth2.clientId,
          ...(parsedContext.oauth2.clientSecret ? { client_secret: parsedContext.oauth2.clientSecret } : {})
        }).toString()
      });
      
      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        const newTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || parsedContext.oauth2.refreshToken,
          expiresIn: tokenData.expires_in
        };
        
        // Update the access token for this request
        headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        
        // Notify the client about the refreshed tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(newTokens);
        }
        
        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "DELETE",
          headers,
          body
        });
        
        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        // Token refresh failed, return a standardized error message
        return Promise.reject(new Error('Unauthorized'));
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // For any error during refresh, return a standardized error message
      return Promise.reject(new Error('Unauthorized'));
    }
  }
  
  // Handle error status codes before attempting to parse JSON
  if (!response.ok) {
    // For multi-status responses (with replyMessageModule), let unmarshalByStatusCode handle the parsing
    // Only throw standardized errors for simple responses or when JSON parsing fails
    // Handle common HTTP error codes with standardized messages
    if (response.status === 401) {
      return Promise.reject(new Error('Unauthorized'));
    } else if (response.status === 403) {
      return Promise.reject(new Error('Forbidden'));
    } else if (response.status === 404) {
      return Promise.reject(new Error('Not Found'));
    } else if (response.status === 500) {
      return Promise.reject(new Error('Internal Server Error'));
    } else {
      return Promise.reject(new Error(`HTTP Error: ${response.status} ${response.statusText}`));
    }
  }
  
  const data = await response.json();
  return Pong.unmarshal(data);
}

async function patchPingPatchRequest(context: {
    server?: string;
    
    path?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
    apiKey?: string; // API key value
    apiKeyName?: string; // Name of the API key parameter
    apiKeyIn?: 'header' | 'query'; // Where to place the API key (default: header)
    // OAuth2 parameters
    oauth2?: {
      clientId: string;
      clientSecret?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenUrl?: string;
      authorizationUrl?: string;
      redirectUri?: string;
      scopes?: string[];
      flow?: 'authorization_code' | 'implicit' | 'password' | 'client_credentials'; // Added flow parameter
      // For password flow
      username?: string; // Username for password flow
      password?: string; // Password for password flow
      onTokenRefresh?: (newTokens: { 
        accessToken: string; 
        refreshToken?: string; 
        expiresIn?: number;
      }) => void;
      // For Implicit flow
      responseType?: 'token' | 'id_token' | 'id_token token'; // For Implicit flow
      state?: string; // For security against CSRF
      onImplicitRedirect?: (authUrl: string) => void; // Callback for handling the redirect in Implicit flow
    };
    credentials?: RequestCredentials; //value for the credentials param we want to use on each request
    additionalHeaders?: Record<string, string | string[]>; //header params we want to use on every request,
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      credentials?: RequestCredentials,
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<Pong> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/ping',
      server: 'localhost:3000',
      apiKeyIn: 'header',
      apiKeyName: 'X-API-Key',
    },
    ...context,
  }

  // Validate parameters before proceeding with the request
  // OAuth2 Implicit flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit') {
    if (!parsedContext.oauth2.authorizationUrl) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires authorizationUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires clientId'));
    }
    if (!parsedContext.oauth2.redirectUri) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires redirectUri'));
    }
    if (!parsedContext.oauth2.onImplicitRedirect) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires onImplicitRedirect handler'));
    }
  }

  // OAuth2 Client Credentials flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires clientId'));
    }
  }

  // OAuth2 Password flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Password flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Password flow requires clientId'));
    }
    if (!parsedContext.oauth2.username) {
      return Promise.reject(new Error('OAuth2 Password flow requires username'));
    }
    if (!parsedContext.oauth2.password) {
      return Promise.reject(new Error('OAuth2 Password flow requires password'));
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.additionalHeaders
  };
  let url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  
  
  // Handle different authentication methods
  if (parsedContext.oauth2 && parsedContext.oauth2.accessToken) {
    // OAuth2 authentication with existing access token
    headers["Authorization"] = `Bearer ${parsedContext.oauth2.accessToken}`;
  } else if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit' && parsedContext.oauth2.authorizationUrl && parsedContext.oauth2.onImplicitRedirect) {
    // Build the authorization URL for implicit flow
    const authUrl = new URL(parsedContext.oauth2.authorizationUrl);
    authUrl.searchParams.append('client_id', parsedContext.oauth2.clientId);
    authUrl.searchParams.append('redirect_uri', parsedContext.oauth2.redirectUri!);
    authUrl.searchParams.append('response_type', parsedContext.oauth2.responseType || 'token');
    
    if (parsedContext.oauth2.state) {
      authUrl.searchParams.append('state', parsedContext.oauth2.state);
    }
    
    if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
      authUrl.searchParams.append('scope', parsedContext.oauth2.scopes.join(' '));
    }
    
    // Call the redirect handler
    parsedContext.oauth2.onImplicitRedirect(authUrl.toString());
    // Since we've initiated a redirect flow, we can't continue with the request
    // The application will need to handle the redirect and subsequent token extraction
    return Promise.reject(new Error('OAuth2 Implicit flow redirect initiated'));
  } else if (parsedContext.bearerToken) {
    // bearer authentication
    headers["Authorization"] = `Bearer ${parsedContext.bearerToken}`;
  } else if (parsedContext.username && parsedContext.password) {
    // basic authentication
    const credentials = Buffer.from(`${parsedContext.username}:${parsedContext.password}`).toString('base64');
    headers["Authorization"] = `Basic ${credentials}`;
  }
  
  // API Key Authentication
  if (parsedContext.apiKey) {
    if (parsedContext.apiKeyIn === 'header') {
      // Add API key to headers
      headers[parsedContext.apiKeyName] = parsedContext.apiKey;
    } else if (parsedContext.apiKeyIn === 'query') {
      // Add API key to query parameters
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${parsedContext.apiKeyName}=${encodeURIComponent(parsedContext.apiKey)}`;
    }
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({url,
    method: 'PATCH',
    headers,
    body
  });	

  // Handle OAuth2 Client Credentials flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: parsedContext.oauth2.clientId
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      // Some APIs use basic auth with client credentials instead of form params
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // If both client ID and secret are provided, some servers prefer basic auth
      if (parsedContext.oauth2.clientId && parsedContext.oauth2.clientSecret) {
        const credentials = Buffer.from(
          `${parsedContext.oauth2.clientId}:${parsedContext.oauth2.clientSecret}`
        ).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
        // Remove client_id and client_secret from the request body when using basic auth
        params.delete('client_id');
        params.delete('client_secret');
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: authHeaders,
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "PATCH",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 Client Credentials flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle OAuth2 password flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'password',
        username: parsedContext.oauth2.username || '',
        password: parsedContext.oauth2.password || '',
        client_id: parsedContext.oauth2.clientId,
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "PATCH",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);

      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 password flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle token refresh for OAuth2 if we get a 401
  if (response.status === 401 && parsedContext.oauth2 && parsedContext.oauth2.refreshToken && parsedContext.oauth2.tokenUrl && parsedContext.oauth2.clientId) {
    try {
      const refreshResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: parsedContext.oauth2.refreshToken,
          client_id: parsedContext.oauth2.clientId,
          ...(parsedContext.oauth2.clientSecret ? { client_secret: parsedContext.oauth2.clientSecret } : {})
        }).toString()
      });
      
      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        const newTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || parsedContext.oauth2.refreshToken,
          expiresIn: tokenData.expires_in
        };
        
        // Update the access token for this request
        headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        
        // Notify the client about the refreshed tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(newTokens);
        }
        
        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "PATCH",
          headers,
          body
        });
        
        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        // Token refresh failed, return a standardized error message
        return Promise.reject(new Error('Unauthorized'));
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // For any error during refresh, return a standardized error message
      return Promise.reject(new Error('Unauthorized'));
    }
  }
  
  // Handle error status codes before attempting to parse JSON
  if (!response.ok) {
    // For multi-status responses (with replyMessageModule), let unmarshalByStatusCode handle the parsing
    // Only throw standardized errors for simple responses or when JSON parsing fails
    // Handle common HTTP error codes with standardized messages
    if (response.status === 401) {
      return Promise.reject(new Error('Unauthorized'));
    } else if (response.status === 403) {
      return Promise.reject(new Error('Forbidden'));
    } else if (response.status === 404) {
      return Promise.reject(new Error('Not Found'));
    } else if (response.status === 500) {
      return Promise.reject(new Error('Internal Server Error'));
    } else {
      return Promise.reject(new Error(`HTTP Error: ${response.status} ${response.statusText}`));
    }
  }
  
  const data = await response.json();
  return Pong.unmarshal(data);
}

async function headPingHeadRequest(context: {
    server?: string;
    
    path?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
    apiKey?: string; // API key value
    apiKeyName?: string; // Name of the API key parameter
    apiKeyIn?: 'header' | 'query'; // Where to place the API key (default: header)
    // OAuth2 parameters
    oauth2?: {
      clientId: string;
      clientSecret?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenUrl?: string;
      authorizationUrl?: string;
      redirectUri?: string;
      scopes?: string[];
      flow?: 'authorization_code' | 'implicit' | 'password' | 'client_credentials'; // Added flow parameter
      // For password flow
      username?: string; // Username for password flow
      password?: string; // Password for password flow
      onTokenRefresh?: (newTokens: { 
        accessToken: string; 
        refreshToken?: string; 
        expiresIn?: number;
      }) => void;
      // For Implicit flow
      responseType?: 'token' | 'id_token' | 'id_token token'; // For Implicit flow
      state?: string; // For security against CSRF
      onImplicitRedirect?: (authUrl: string) => void; // Callback for handling the redirect in Implicit flow
    };
    credentials?: RequestCredentials; //value for the credentials param we want to use on each request
    additionalHeaders?: Record<string, string | string[]>; //header params we want to use on every request,
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      credentials?: RequestCredentials,
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<Pong> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/ping',
      server: 'localhost:3000',
      apiKeyIn: 'header',
      apiKeyName: 'X-API-Key',
    },
    ...context,
  }

  // Validate parameters before proceeding with the request
  // OAuth2 Implicit flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit') {
    if (!parsedContext.oauth2.authorizationUrl) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires authorizationUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires clientId'));
    }
    if (!parsedContext.oauth2.redirectUri) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires redirectUri'));
    }
    if (!parsedContext.oauth2.onImplicitRedirect) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires onImplicitRedirect handler'));
    }
  }

  // OAuth2 Client Credentials flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires clientId'));
    }
  }

  // OAuth2 Password flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Password flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Password flow requires clientId'));
    }
    if (!parsedContext.oauth2.username) {
      return Promise.reject(new Error('OAuth2 Password flow requires username'));
    }
    if (!parsedContext.oauth2.password) {
      return Promise.reject(new Error('OAuth2 Password flow requires password'));
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.additionalHeaders
  };
  let url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  
  
  // Handle different authentication methods
  if (parsedContext.oauth2 && parsedContext.oauth2.accessToken) {
    // OAuth2 authentication with existing access token
    headers["Authorization"] = `Bearer ${parsedContext.oauth2.accessToken}`;
  } else if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit' && parsedContext.oauth2.authorizationUrl && parsedContext.oauth2.onImplicitRedirect) {
    // Build the authorization URL for implicit flow
    const authUrl = new URL(parsedContext.oauth2.authorizationUrl);
    authUrl.searchParams.append('client_id', parsedContext.oauth2.clientId);
    authUrl.searchParams.append('redirect_uri', parsedContext.oauth2.redirectUri!);
    authUrl.searchParams.append('response_type', parsedContext.oauth2.responseType || 'token');
    
    if (parsedContext.oauth2.state) {
      authUrl.searchParams.append('state', parsedContext.oauth2.state);
    }
    
    if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
      authUrl.searchParams.append('scope', parsedContext.oauth2.scopes.join(' '));
    }
    
    // Call the redirect handler
    parsedContext.oauth2.onImplicitRedirect(authUrl.toString());
    // Since we've initiated a redirect flow, we can't continue with the request
    // The application will need to handle the redirect and subsequent token extraction
    return Promise.reject(new Error('OAuth2 Implicit flow redirect initiated'));
  } else if (parsedContext.bearerToken) {
    // bearer authentication
    headers["Authorization"] = `Bearer ${parsedContext.bearerToken}`;
  } else if (parsedContext.username && parsedContext.password) {
    // basic authentication
    const credentials = Buffer.from(`${parsedContext.username}:${parsedContext.password}`).toString('base64');
    headers["Authorization"] = `Basic ${credentials}`;
  }
  
  // API Key Authentication
  if (parsedContext.apiKey) {
    if (parsedContext.apiKeyIn === 'header') {
      // Add API key to headers
      headers[parsedContext.apiKeyName] = parsedContext.apiKey;
    } else if (parsedContext.apiKeyIn === 'query') {
      // Add API key to query parameters
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${parsedContext.apiKeyName}=${encodeURIComponent(parsedContext.apiKey)}`;
    }
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({url,
    method: 'HEAD',
    headers,
    body
  });	

  // Handle OAuth2 Client Credentials flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: parsedContext.oauth2.clientId
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      // Some APIs use basic auth with client credentials instead of form params
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // If both client ID and secret are provided, some servers prefer basic auth
      if (parsedContext.oauth2.clientId && parsedContext.oauth2.clientSecret) {
        const credentials = Buffer.from(
          `${parsedContext.oauth2.clientId}:${parsedContext.oauth2.clientSecret}`
        ).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
        // Remove client_id and client_secret from the request body when using basic auth
        params.delete('client_id');
        params.delete('client_secret');
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: authHeaders,
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "HEAD",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 Client Credentials flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle OAuth2 password flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'password',
        username: parsedContext.oauth2.username || '',
        password: parsedContext.oauth2.password || '',
        client_id: parsedContext.oauth2.clientId,
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "HEAD",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);

      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 password flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle token refresh for OAuth2 if we get a 401
  if (response.status === 401 && parsedContext.oauth2 && parsedContext.oauth2.refreshToken && parsedContext.oauth2.tokenUrl && parsedContext.oauth2.clientId) {
    try {
      const refreshResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: parsedContext.oauth2.refreshToken,
          client_id: parsedContext.oauth2.clientId,
          ...(parsedContext.oauth2.clientSecret ? { client_secret: parsedContext.oauth2.clientSecret } : {})
        }).toString()
      });
      
      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        const newTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || parsedContext.oauth2.refreshToken,
          expiresIn: tokenData.expires_in
        };
        
        // Update the access token for this request
        headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        
        // Notify the client about the refreshed tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(newTokens);
        }
        
        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "HEAD",
          headers,
          body
        });
        
        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        // Token refresh failed, return a standardized error message
        return Promise.reject(new Error('Unauthorized'));
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // For any error during refresh, return a standardized error message
      return Promise.reject(new Error('Unauthorized'));
    }
  }
  
  // Handle error status codes before attempting to parse JSON
  if (!response.ok) {
    // For multi-status responses (with replyMessageModule), let unmarshalByStatusCode handle the parsing
    // Only throw standardized errors for simple responses or when JSON parsing fails
    // Handle common HTTP error codes with standardized messages
    if (response.status === 401) {
      return Promise.reject(new Error('Unauthorized'));
    } else if (response.status === 403) {
      return Promise.reject(new Error('Forbidden'));
    } else if (response.status === 404) {
      return Promise.reject(new Error('Not Found'));
    } else if (response.status === 500) {
      return Promise.reject(new Error('Internal Server Error'));
    } else {
      return Promise.reject(new Error(`HTTP Error: ${response.status} ${response.statusText}`));
    }
  }
  
  const data = await response.json();
  return Pong.unmarshal(data);
}

async function optionsPingOptionsRequest(context: {
    server?: string;
    
    path?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
    apiKey?: string; // API key value
    apiKeyName?: string; // Name of the API key parameter
    apiKeyIn?: 'header' | 'query'; // Where to place the API key (default: header)
    // OAuth2 parameters
    oauth2?: {
      clientId: string;
      clientSecret?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenUrl?: string;
      authorizationUrl?: string;
      redirectUri?: string;
      scopes?: string[];
      flow?: 'authorization_code' | 'implicit' | 'password' | 'client_credentials'; // Added flow parameter
      // For password flow
      username?: string; // Username for password flow
      password?: string; // Password for password flow
      onTokenRefresh?: (newTokens: { 
        accessToken: string; 
        refreshToken?: string; 
        expiresIn?: number;
      }) => void;
      // For Implicit flow
      responseType?: 'token' | 'id_token' | 'id_token token'; // For Implicit flow
      state?: string; // For security against CSRF
      onImplicitRedirect?: (authUrl: string) => void; // Callback for handling the redirect in Implicit flow
    };
    credentials?: RequestCredentials; //value for the credentials param we want to use on each request
    additionalHeaders?: Record<string, string | string[]>; //header params we want to use on every request,
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      credentials?: RequestCredentials,
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<Pong> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/ping',
      server: 'localhost:3000',
      apiKeyIn: 'header',
      apiKeyName: 'X-API-Key',
    },
    ...context,
  }

  // Validate parameters before proceeding with the request
  // OAuth2 Implicit flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit') {
    if (!parsedContext.oauth2.authorizationUrl) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires authorizationUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires clientId'));
    }
    if (!parsedContext.oauth2.redirectUri) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires redirectUri'));
    }
    if (!parsedContext.oauth2.onImplicitRedirect) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires onImplicitRedirect handler'));
    }
  }

  // OAuth2 Client Credentials flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires clientId'));
    }
  }

  // OAuth2 Password flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Password flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Password flow requires clientId'));
    }
    if (!parsedContext.oauth2.username) {
      return Promise.reject(new Error('OAuth2 Password flow requires username'));
    }
    if (!parsedContext.oauth2.password) {
      return Promise.reject(new Error('OAuth2 Password flow requires password'));
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.additionalHeaders
  };
  let url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  
  
  // Handle different authentication methods
  if (parsedContext.oauth2 && parsedContext.oauth2.accessToken) {
    // OAuth2 authentication with existing access token
    headers["Authorization"] = `Bearer ${parsedContext.oauth2.accessToken}`;
  } else if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit' && parsedContext.oauth2.authorizationUrl && parsedContext.oauth2.onImplicitRedirect) {
    // Build the authorization URL for implicit flow
    const authUrl = new URL(parsedContext.oauth2.authorizationUrl);
    authUrl.searchParams.append('client_id', parsedContext.oauth2.clientId);
    authUrl.searchParams.append('redirect_uri', parsedContext.oauth2.redirectUri!);
    authUrl.searchParams.append('response_type', parsedContext.oauth2.responseType || 'token');
    
    if (parsedContext.oauth2.state) {
      authUrl.searchParams.append('state', parsedContext.oauth2.state);
    }
    
    if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
      authUrl.searchParams.append('scope', parsedContext.oauth2.scopes.join(' '));
    }
    
    // Call the redirect handler
    parsedContext.oauth2.onImplicitRedirect(authUrl.toString());
    // Since we've initiated a redirect flow, we can't continue with the request
    // The application will need to handle the redirect and subsequent token extraction
    return Promise.reject(new Error('OAuth2 Implicit flow redirect initiated'));
  } else if (parsedContext.bearerToken) {
    // bearer authentication
    headers["Authorization"] = `Bearer ${parsedContext.bearerToken}`;
  } else if (parsedContext.username && parsedContext.password) {
    // basic authentication
    const credentials = Buffer.from(`${parsedContext.username}:${parsedContext.password}`).toString('base64');
    headers["Authorization"] = `Basic ${credentials}`;
  }
  
  // API Key Authentication
  if (parsedContext.apiKey) {
    if (parsedContext.apiKeyIn === 'header') {
      // Add API key to headers
      headers[parsedContext.apiKeyName] = parsedContext.apiKey;
    } else if (parsedContext.apiKeyIn === 'query') {
      // Add API key to query parameters
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${parsedContext.apiKeyName}=${encodeURIComponent(parsedContext.apiKey)}`;
    }
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({url,
    method: 'OPTIONS',
    headers,
    body
  });	

  // Handle OAuth2 Client Credentials flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: parsedContext.oauth2.clientId
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      // Some APIs use basic auth with client credentials instead of form params
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // If both client ID and secret are provided, some servers prefer basic auth
      if (parsedContext.oauth2.clientId && parsedContext.oauth2.clientSecret) {
        const credentials = Buffer.from(
          `${parsedContext.oauth2.clientId}:${parsedContext.oauth2.clientSecret}`
        ).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
        // Remove client_id and client_secret from the request body when using basic auth
        params.delete('client_id');
        params.delete('client_secret');
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: authHeaders,
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "OPTIONS",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 Client Credentials flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle OAuth2 password flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'password',
        username: parsedContext.oauth2.username || '',
        password: parsedContext.oauth2.password || '',
        client_id: parsedContext.oauth2.clientId,
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "OPTIONS",
          headers,
          body
        });

        const data = await retryResponse.json();
        return Pong.unmarshal(data);

      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 password flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle token refresh for OAuth2 if we get a 401
  if (response.status === 401 && parsedContext.oauth2 && parsedContext.oauth2.refreshToken && parsedContext.oauth2.tokenUrl && parsedContext.oauth2.clientId) {
    try {
      const refreshResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: parsedContext.oauth2.refreshToken,
          client_id: parsedContext.oauth2.clientId,
          ...(parsedContext.oauth2.clientSecret ? { client_secret: parsedContext.oauth2.clientSecret } : {})
        }).toString()
      });
      
      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        const newTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || parsedContext.oauth2.refreshToken,
          expiresIn: tokenData.expires_in
        };
        
        // Update the access token for this request
        headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        
        // Notify the client about the refreshed tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(newTokens);
        }
        
        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "OPTIONS",
          headers,
          body
        });
        
        const data = await retryResponse.json();
        return Pong.unmarshal(data);
      } else {
        // Token refresh failed, return a standardized error message
        return Promise.reject(new Error('Unauthorized'));
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // For any error during refresh, return a standardized error message
      return Promise.reject(new Error('Unauthorized'));
    }
  }
  
  // Handle error status codes before attempting to parse JSON
  if (!response.ok) {
    // For multi-status responses (with replyMessageModule), let unmarshalByStatusCode handle the parsing
    // Only throw standardized errors for simple responses or when JSON parsing fails
    // Handle common HTTP error codes with standardized messages
    if (response.status === 401) {
      return Promise.reject(new Error('Unauthorized'));
    } else if (response.status === 403) {
      return Promise.reject(new Error('Forbidden'));
    } else if (response.status === 404) {
      return Promise.reject(new Error('Not Found'));
    } else if (response.status === 500) {
      return Promise.reject(new Error('Internal Server Error'));
    } else {
      return Promise.reject(new Error(`HTTP Error: ${response.status} ${response.statusText}`));
    }
  }
  
  const data = await response.json();
  return Pong.unmarshal(data);
}

async function getMultiStatusResponse(context: {
    server?: string;
    
    path?: string;
    bearerToken?: string;
    username?: string;
    password?: string;
    apiKey?: string; // API key value
    apiKeyName?: string; // Name of the API key parameter
    apiKeyIn?: 'header' | 'query'; // Where to place the API key (default: header)
    // OAuth2 parameters
    oauth2?: {
      clientId: string;
      clientSecret?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenUrl?: string;
      authorizationUrl?: string;
      redirectUri?: string;
      scopes?: string[];
      flow?: 'authorization_code' | 'implicit' | 'password' | 'client_credentials'; // Added flow parameter
      // For password flow
      username?: string; // Username for password flow
      password?: string; // Password for password flow
      onTokenRefresh?: (newTokens: { 
        accessToken: string; 
        refreshToken?: string; 
        expiresIn?: number;
      }) => void;
      // For Implicit flow
      responseType?: 'token' | 'id_token' | 'id_token token'; // For Implicit flow
      state?: string; // For security against CSRF
      onImplicitRedirect?: (authUrl: string) => void; // Callback for handling the redirect in Implicit flow
    };
    credentials?: RequestCredentials; //value for the credentials param we want to use on each request
    additionalHeaders?: Record<string, string | string[]>; //header params we want to use on every request,
    makeRequestCallback?: ({
      method, body, url, headers
    }: {
      url: string, 
      headers?: Record<string, string | string[]>,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD',
      credentials?: RequestCredentials,
      body?: any
    }) => Promise<{
      ok: boolean,
      status: number,
      statusText: string,
      json: () => Record<any, any> | Promise<Record<any, any>>,
    }>
  }): Promise<MultiStatusResponseReplyPayloadModule.MultiStatusResponseReplyPayload> {
  const parsedContext = {
    ...{
      makeRequestCallback: async ({url, body, method, headers}) => {
        return NodeFetch.default(url, {
          body,
          method,
          headers
        })
      },
      path: '/ping',
      server: 'localhost:3000',
      apiKeyIn: 'header',
      apiKeyName: 'X-API-Key',
    },
    ...context,
  }

  // Validate parameters before proceeding with the request
  // OAuth2 Implicit flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit') {
    if (!parsedContext.oauth2.authorizationUrl) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires authorizationUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires clientId'));
    }
    if (!parsedContext.oauth2.redirectUri) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires redirectUri'));
    }
    if (!parsedContext.oauth2.onImplicitRedirect) {
      return Promise.reject(new Error('OAuth2 Implicit flow requires onImplicitRedirect handler'));
    }
  }

  // OAuth2 Client Credentials flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Client Credentials flow requires clientId'));
    }
  }

  // OAuth2 Password flow validation
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password') {
    if (!parsedContext.oauth2.tokenUrl) {
      return Promise.reject(new Error('OAuth2 Password flow requires tokenUrl'));
    }
    if (!parsedContext.oauth2.clientId) {
      return Promise.reject(new Error('OAuth2 Password flow requires clientId'));
    }
    if (!parsedContext.oauth2.username) {
      return Promise.reject(new Error('OAuth2 Password flow requires username'));
    }
    if (!parsedContext.oauth2.password) {
      return Promise.reject(new Error('OAuth2 Password flow requires password'));
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...parsedContext.additionalHeaders
  };
  let url = `${parsedContext.server}${parsedContext.path}`;

  let body: any;
  
  
  // Handle different authentication methods
  if (parsedContext.oauth2 && parsedContext.oauth2.accessToken) {
    // OAuth2 authentication with existing access token
    headers["Authorization"] = `Bearer ${parsedContext.oauth2.accessToken}`;
  } else if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'implicit' && parsedContext.oauth2.authorizationUrl && parsedContext.oauth2.onImplicitRedirect) {
    // Build the authorization URL for implicit flow
    const authUrl = new URL(parsedContext.oauth2.authorizationUrl);
    authUrl.searchParams.append('client_id', parsedContext.oauth2.clientId);
    authUrl.searchParams.append('redirect_uri', parsedContext.oauth2.redirectUri!);
    authUrl.searchParams.append('response_type', parsedContext.oauth2.responseType || 'token');
    
    if (parsedContext.oauth2.state) {
      authUrl.searchParams.append('state', parsedContext.oauth2.state);
    }
    
    if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
      authUrl.searchParams.append('scope', parsedContext.oauth2.scopes.join(' '));
    }
    
    // Call the redirect handler
    parsedContext.oauth2.onImplicitRedirect(authUrl.toString());
    // Since we've initiated a redirect flow, we can't continue with the request
    // The application will need to handle the redirect and subsequent token extraction
    return Promise.reject(new Error('OAuth2 Implicit flow redirect initiated'));
  } else if (parsedContext.bearerToken) {
    // bearer authentication
    headers["Authorization"] = `Bearer ${parsedContext.bearerToken}`;
  } else if (parsedContext.username && parsedContext.password) {
    // basic authentication
    const credentials = Buffer.from(`${parsedContext.username}:${parsedContext.password}`).toString('base64');
    headers["Authorization"] = `Basic ${credentials}`;
  }
  
  // API Key Authentication
  if (parsedContext.apiKey) {
    if (parsedContext.apiKeyIn === 'header') {
      // Add API key to headers
      headers[parsedContext.apiKeyName] = parsedContext.apiKey;
    } else if (parsedContext.apiKeyIn === 'query') {
      // Add API key to query parameters
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${parsedContext.apiKeyName}=${encodeURIComponent(parsedContext.apiKey)}`;
    }
  }

  // Make the API request
  const response = await parsedContext.makeRequestCallback({url,
    method: 'GET',
    headers,
    body
  });	

  // Handle OAuth2 Client Credentials flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'client_credentials' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: parsedContext.oauth2.clientId
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      // Some APIs use basic auth with client credentials instead of form params
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      // If both client ID and secret are provided, some servers prefer basic auth
      if (parsedContext.oauth2.clientId && parsedContext.oauth2.clientSecret) {
        const credentials = Buffer.from(
          `${parsedContext.oauth2.clientId}:${parsedContext.oauth2.clientSecret}`
        ).toString('base64');
        authHeaders['Authorization'] = `Basic ${credentials}`;
        // Remove client_id and client_secret from the request body when using basic auth
        params.delete('client_id');
        params.delete('client_secret');
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: authHeaders,
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "GET",
          headers,
          body
        });

        const data = await retryResponse.json();
        return MultiStatusResponseReplyPayloadModule.unmarshalByStatusCode(data, retryResponse.status);
      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 Client Credentials flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle OAuth2 password flow
  if (parsedContext.oauth2 && parsedContext.oauth2.flow === 'password' && parsedContext.oauth2.tokenUrl) {
    try {
      const params = new URLSearchParams({
        grant_type: 'password',
        username: parsedContext.oauth2.username || '',
        password: parsedContext.oauth2.password || '',
        client_id: parsedContext.oauth2.clientId,
      });

      if (parsedContext.oauth2.clientSecret) {
        params.append('client_secret', parsedContext.oauth2.clientSecret);
      }

      if (parsedContext.oauth2.scopes && parsedContext.oauth2.scopes.length > 0) {
        params.append('scope', parsedContext.oauth2.scopes.join(' '));
      }

      const tokenResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const tokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: tokenData.expires_in
        };

        // Update headers with the new token
        headers["Authorization"] = `Bearer ${tokens.accessToken}`;

        // Notify the client about the tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(tokens);
        }

        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "GET",
          headers,
          body
        });

        const data = await retryResponse.json();
        return MultiStatusResponseReplyPayloadModule.unmarshalByStatusCode(data, retryResponse.status);

      } else {
        return Promise.reject(new Error(`OAuth2 token request failed: ${tokenResponse.statusText}`));
      }
    } catch (error) {
      console.error('Error in OAuth2 password flow:', error);
      return Promise.reject(error);
    }
  }

  // Handle token refresh for OAuth2 if we get a 401
  if (response.status === 401 && parsedContext.oauth2 && parsedContext.oauth2.refreshToken && parsedContext.oauth2.tokenUrl && parsedContext.oauth2.clientId) {
    try {
      const refreshResponse = await NodeFetch.default(parsedContext.oauth2.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: parsedContext.oauth2.refreshToken,
          client_id: parsedContext.oauth2.clientId,
          ...(parsedContext.oauth2.clientSecret ? { client_secret: parsedContext.oauth2.clientSecret } : {})
        }).toString()
      });
      
      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        const newTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || parsedContext.oauth2.refreshToken,
          expiresIn: tokenData.expires_in
        };
        
        // Update the access token for this request
        headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
        
        // Notify the client about the refreshed tokens
        if (parsedContext.oauth2.onTokenRefresh) {
          parsedContext.oauth2.onTokenRefresh(newTokens);
        }
        
        // Retry the original request with the new token
        const retryResponse = await parsedContext.makeRequestCallback({
          url,
          method: "GET",
          headers,
          body
        });
        
        const data = await retryResponse.json();
        return MultiStatusResponseReplyPayloadModule.unmarshalByStatusCode(data, retryResponse.status);
      } else {
        // Token refresh failed, return a standardized error message
        return Promise.reject(new Error('Unauthorized'));
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // For any error during refresh, return a standardized error message
      return Promise.reject(new Error('Unauthorized'));
    }
  }
  
  // Handle error status codes before attempting to parse JSON
  if (!response.ok) {
    // For multi-status responses (with replyMessageModule), let unmarshalByStatusCode handle the parsing
    // Only throw standardized errors for simple responses or when JSON parsing fails
    
  }
  
  // For multi-status responses, always try to parse JSON and let unmarshalByStatusCode handle it
  try {
    const data = await response.json();
    return MultiStatusResponseReplyPayloadModule.unmarshalByStatusCode(data, response.status);
  } catch (error) {
    // If JSON parsing fails or unmarshalByStatusCode fails, provide standardized error messages
    if (response.status === 401) {
      return Promise.reject(new Error('Unauthorized'));
    } else if (response.status === 403) {
      return Promise.reject(new Error('Forbidden'));
    } else if (response.status === 404) {
      return Promise.reject(new Error('Not Found'));
    } else if (response.status === 500) {
      return Promise.reject(new Error('Internal Server Error'));
    } else {
      return Promise.reject(new Error(`HTTP Error: ${response.status} ${response.statusText}`));
    }
  }
}

export { postPingPostRequest, getPingGetRequest, putPingPutRequest, deletePingDeleteRequest, patchPingPatchRequest, headPingHeadRequest, optionsPingOptionsRequest, getMultiStatusResponse };
