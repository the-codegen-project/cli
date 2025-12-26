---
sidebar_position: 99
---

# HTTP(S)

HTTP client generator creates type-safe functions for making HTTP requests based on your API specification. It supports various authentication methods, pagination, retry logic, and extensibility hooks.

It is currently available through the generators ([channels](../generators/channels.md)):

All of this is available through [AsyncAPI](../inputs/asyncapi.md). Requires HTTP `method` binding for operation and `statusCode` for messages.

## TypeScript

| **Feature** | Is supported? |
|---|---|
| Download | ❌ |
| Upload | ❌ |
| Offset based Pagination | ✅ |
| Cursor based Pagination | ✅ |
| Page based Pagination | ✅ |
| Range based Pagination | ✅ |
| Retry with backoff | ✅ |
| OAuth2 Authorization code | ❌ (browser-only) |
| OAuth2 Implicit | ❌ (browser-only) |
| OAuth2 Password | ✅ |
| OAuth2 Client Credentials | ✅ |
| OAuth2 Token Refresh | ✅ |
| Username/password Authentication | ✅ |
| Bearer Authentication | ✅ |
| Basic Authentication | ✅ |
| API Key Authentication | ✅ |
| Request/Response Hooks | ✅ |
| XML Based API | ❌ |
| JSON Based API | ✅ |
| POST | ✅ |
| GET | ✅ |
| PATCH | ✅ |
| DELETE | ✅ |
| PUT | ✅ |
| HEAD | ✅ |
| OPTIONS | ✅ |

## Channels

Read more about the [channels generator here](../generators/channels.md).

<table>
<thead>
  <tr>
    <th>Input (AsyncAPI)</th>
    <th>Using the code</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>

```yaml
asyncapi: 3.0.0
info:
  title: User API
  version: 1.0.0
channels:
  ping:
    address: /ping
    messages:
      pingRequest:
        $ref: '#/components/messages/PingRequest'
      pongResponse:
        $ref: '#/components/messages/PongResponse'
operations:
  postPing:
    action: send
    channel:
      $ref: '#/channels/ping'
    bindings:
      http:
        method: POST
    reply:
      channel:
        $ref: '#/channels/ping'
      messages:
        - $ref: '#/channels/ping/messages/pongResponse'
components:
  messages:
    PingRequest:
      payload:
        type: object
        properties:
          message:
            type: string
    PongResponse:
      payload:
        type: object
        properties:
          response:
            type: string
      bindings:
        http:
          statusCode: 200
```
</td>
    <td>

```ts
// Location depends on the payload generator configurations
import { Ping } from './__gen__/payloads/Ping';
import { Pong } from './__gen__/payloads/Pong';
// Location depends on the channel generator configurations
import { Protocols } from './__gen__/channels';
const { http_client } = Protocols;
const { postPingPostRequest } = http_client;

// Create a request payload
const pingMessage = new Ping({ message: 'Hello!' });

// Make a simple request
const response = await postPingPostRequest({
  payload: pingMessage,
  server: 'https://api.example.com'
});

// Access the response
console.log(response.data.response);  // The deserialized Pong
console.log(response.status);          // 200
console.log(response.headers);         // Response headers
console.log(response.rawData);         // Raw JSON response
```
</td>
  </tr>
</tbody>
</table>

## Authentication

The HTTP client uses a discriminated union for authentication, providing excellent TypeScript autocomplete support.

### Bearer Token

```typescript
const response = await postPingPostRequest({
  payload: message,
  server: 'https://api.example.com',
  auth: {
    type: 'bearer',
    token: 'your-jwt-token'
  }
});
```

### Basic Authentication

```typescript
const response = await postPingPostRequest({
  payload: message,
  server: 'https://api.example.com',
  auth: {
    type: 'basic',
    username: 'user',
    password: 'pass'
  }
});
```

### API Key

```typescript
// API Key in header (default)
const response = await postPingPostRequest({
  payload: message,
  server: 'https://api.example.com',
  auth: {
    type: 'apiKey',
    key: 'your-api-key',
    name: 'X-API-Key',  // Header name (default: 'X-API-Key')
    in: 'header'        // 'header' or 'query'
  }
});

// API Key in query parameter
const response = await postPingPostRequest({
  payload: message,
  server: 'https://api.example.com',
  auth: {
    type: 'apiKey',
    key: 'your-api-key',
    name: 'api_key',
    in: 'query'
  }
});
```

### OAuth2 Client Credentials

For server-to-server authentication:

```typescript
const response = await postPingPostRequest({
  payload: message,
  server: 'https://api.example.com',
  auth: {
    type: 'oauth2',
    flow: 'client_credentials',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    tokenUrl: 'https://auth.example.com/oauth/token',
    scopes: ['read', 'write'],
    onTokenRefresh: (tokens) => {
      // Called when tokens are obtained/refreshed
      console.log('New access token:', tokens.accessToken);
    }
  }
});
```

### OAuth2 Password Flow

For legacy applications requiring username/password:

```typescript
const response = await postPingPostRequest({
  payload: message,
  server: 'https://api.example.com',
  auth: {
    type: 'oauth2',
    flow: 'password',
    clientId: 'your-client-id',
    username: 'user@example.com',
    password: 'user-password',
    tokenUrl: 'https://auth.example.com/oauth/token',
    onTokenRefresh: (tokens) => {
      // Store tokens for future use
      saveTokens(tokens);
    }
  }
});
```

### OAuth2 with Pre-obtained Token

For tokens obtained via browser-based flows (implicit, authorization code):

```typescript
// Token obtained from browser OAuth flow
const accessToken = getTokenFromBrowserFlow();

const response = await postPingPostRequest({
  payload: message,
  server: 'https://api.example.com',
  auth: {
    type: 'oauth2',
    accessToken: accessToken,
    refreshToken: refreshToken,  // Optional: for auto-refresh on 401
    tokenUrl: 'https://auth.example.com/oauth/token',
    clientId: 'your-client-id',
    onTokenRefresh: (tokens) => {
      // Update stored tokens
      updateStoredTokens(tokens);
    }
  }
});
```

## Pagination

The HTTP client supports multiple pagination strategies. Pagination parameters can be placed in query parameters or headers.

### Offset-based Pagination

```typescript
const response = await getItemsRequest({
  server: 'https://api.example.com',
  pagination: {
    type: 'offset',
    offset: 0,
    limit: 25,
    in: 'query',              // 'query' or 'header'
    offsetParam: 'offset',    // Query param name (default: 'offset')
    limitParam: 'limit'       // Query param name (default: 'limit')
  }
});

// Navigate pages
if (response.hasNextPage?.()) {
  const nextPage = await response.getNextPage?.();
}
```

### Cursor-based Pagination

```typescript
const response = await getItemsRequest({
  server: 'https://api.example.com',
  pagination: {
    type: 'cursor',
    cursor: undefined,  // First page
    limit: 25,
    cursorParam: 'cursor'
  }
});

// Get next page using cursor from response
if (response.pagination?.nextCursor) {
  const nextPage = await response.getNextPage?.();
}
```

### Page-based Pagination

```typescript
const response = await getItemsRequest({
  server: 'https://api.example.com',
  pagination: {
    type: 'page',
    page: 1,
    pageSize: 25,
    pageParam: 'page',
    pageSizeParam: 'per_page'
  }
});
```

### Range-based Pagination (RFC 7233)

```typescript
const response = await getItemsRequest({
  server: 'https://api.example.com',
  pagination: {
    type: 'range',
    start: 0,
    end: 24,
    unit: 'items',         // Range unit (default: 'items')
    rangeHeader: 'Range'   // Header name (default: 'Range')
  }
});
// Sends: Range: items=0-24
```

## Retry with Exponential Backoff

Configure automatic retry for failed requests:

```typescript
const response = await postPingPostRequest({
  payload: message,
  server: 'https://api.example.com',
  retry: {
    maxRetries: 3,              // Maximum retry attempts (default: 3)
    initialDelayMs: 1000,       // Initial delay before first retry (default: 1000)
    maxDelayMs: 30000,          // Maximum delay between retries (default: 30000)
    backoffMultiplier: 2,       // Exponential backoff multiplier (default: 2)
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],  // Status codes to retry
    retryOnNetworkError: true,  // Retry on network failures
    onRetry: (attempt, delay, error) => {
      console.log(`Retry attempt ${attempt} after ${delay}ms: ${error.message}`);
    }
  }
});
```

## Request/Response Hooks

Customize request behavior with hooks:

```typescript
const response = await postPingPostRequest({
  payload: message,
  server: 'https://api.example.com',
  hooks: {
    // Modify request before sending
    beforeRequest: async (params) => {
      console.log('Making request to:', params.url);
      // Add custom header
      return {
        ...params,
        headers: {
          ...params.headers,
          'X-Request-ID': generateRequestId()
        }
      };
    },

    // Replace the default fetch implementation
    makeRequest: async (params) => {
      // Use axios, got, or any HTTP client
      const axiosResponse = await axios({
        url: params.url,
        method: params.method,
        headers: params.headers,
        data: params.body
      });
      return {
        ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
        status: axiosResponse.status,
        statusText: axiosResponse.statusText,
        headers: axiosResponse.headers,
        json: () => axiosResponse.data
      };
    },

    // Process response after receiving
    afterResponse: async (response, params) => {
      console.log(`Response ${response.status} from ${params.url}`);
      return response;
    },

    // Handle errors
    onError: async (error, params) => {
      console.error(`Request failed: ${error.message}`);
      // Optionally transform the error
      return error;
    }
  }
});
```

## Path Parameters

For operations with path parameters, the generator creates typed parameter classes:

```typescript
import { UserItemsParameters } from './__gen__/parameters/UserItemsParameters';

// Create parameters with type safety
const params = new UserItemsParameters({
  userId: 'user-123',
  itemId: 456
});

const response = await getGetUserItem({
  server: 'https://api.example.com',
  parameters: params  // Replaces {userId} and {itemId} in path
});
```

## Typed Headers

For operations with defined headers, the generator creates typed header classes:

```typescript
import { ItemRequestHeaders } from './__gen__/headers/ItemRequestHeaders';

const headers = new ItemRequestHeaders({
  xCorrelationId: 'corr-123',
  xRequestId: 'req-456'
});

const response = await putUpdateUserItem({
  server: 'https://api.example.com',
  parameters: params,
  payload: itemData,
  requestHeaders: headers  // Type-safe headers
});
```

## Additional Headers and Query Parameters

Add custom headers or query parameters to any request:

```typescript
const response = await postPingPostRequest({
  payload: message,
  server: 'https://api.example.com',
  additionalHeaders: {
    'X-Custom-Header': 'value',
    'Accept-Language': 'en-US'
  },
  queryParams: {
    include: 'metadata',
    format: 'detailed'
  }
});
```

## Multi-Status Responses

For operations that return different payloads based on status code, the generator creates union types:

```yaml
# AsyncAPI spec with multiple response types
operations:
  getItem:
    reply:
      messages:
        - $ref: '#/components/messages/ItemResponse'      # 200
        - $ref: '#/components/messages/NotFoundError'     # 404
```

```typescript
const response = await getItemRequest({
  server: 'https://api.example.com',
  parameters: params
});

// Response type is union: ItemResponse | NotFoundError
// Use response.status to discriminate
if (response.status === 200) {
  console.log('Item:', response.data); // ItemResponse
} else if (response.status === 404) {
  console.log('Not found:', response.data); // NotFoundError
}
```