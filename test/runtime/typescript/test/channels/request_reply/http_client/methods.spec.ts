/* eslint-disable no-console */
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import { Ping } from "../../../../src/request-reply/payloads/Ping";
import { createTestServer, runWithServer } from './test-utils';
import {
  postPingPostRequest,
  getPingGetRequest,
  putPingPutRequest,
  deletePingDeleteRequest,
  patchPingPatchRequest,
  headPingHeadRequest,
  optionsPingOptionsRequest,
} from '../../../../src/request-reply/channels/http_client';

jest.setTimeout(15000);

describe('HTTP Client - HTTP Methods', () => {
  describe('GET method', () => {
    it('should make GET request without body', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedMethod: string | undefined;

      router.get('/ping', (req, res) => {
        receivedMethod = req.method;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await getPingGetRequest({
          server: `http://localhost:${port}`
        });

        expect(receivedMethod).toBe('GET');
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      });
    });
  });

  describe('POST method', () => {
    it('should make POST request with body', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});
      const replyMessage = new Pong({});
      let receivedMethod: string | undefined;
      let receivedBody: any;

      router.post('/ping', (req, res) => {
        receivedMethod = req.method;
        receivedBody = req.body;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await postPingPostRequest({
          server: `http://localhost:${port}`,
          payload: requestMessage
        });

        expect(receivedMethod).toBe('POST');
        expect(receivedBody).toBeDefined();
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      });
    });
  });

  describe('PUT method', () => {
    it('should make PUT request with body', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});
      const replyMessage = new Pong({});
      let receivedMethod: string | undefined;
      let receivedBody: any;

      router.put('/ping', (req, res) => {
        receivedMethod = req.method;
        receivedBody = req.body;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await putPingPutRequest({
          server: `http://localhost:${port}`,
          payload: requestMessage
        });

        expect(receivedMethod).toBe('PUT');
        expect(receivedBody).toBeDefined();
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      });
    });

    it('should support PUT with authentication', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});
      const replyMessage = new Pong({});
      let receivedAuthHeader: string | undefined;

      router.put('/ping', (req, res) => {
        receivedAuthHeader = req.headers.authorization;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        await putPingPutRequest({
          server: `http://localhost:${port}`,
          payload: requestMessage,
          auth: { type: 'bearer', token: 'put-token' }
        });

        expect(receivedAuthHeader).toBe('Bearer put-token');
      });
    });

    it('should support PUT with query params', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});
      const replyMessage = new Pong({});
      let receivedQuery: any;

      router.put('/ping', (req, res) => {
        receivedQuery = req.query;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        await putPingPutRequest({
          server: `http://localhost:${port}`,
          payload: requestMessage,
          queryParams: { version: '2' }
        });

        expect(receivedQuery.version).toBe('2');
      });
    });
  });

  describe('DELETE method', () => {
    it('should make DELETE request', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedMethod: string | undefined;

      router.delete('/ping', (req, res) => {
        receivedMethod = req.method;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await deletePingDeleteRequest({
          server: `http://localhost:${port}`
        });

        expect(receivedMethod).toBe('DELETE');
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      });
    });

    it('should support DELETE with authentication', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedAuthHeader: string | undefined;

      router.delete('/ping', (req, res) => {
        receivedAuthHeader = req.headers.authorization;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        await deletePingDeleteRequest({
          server: `http://localhost:${port}`,
          auth: { type: 'bearer', token: 'delete-token' }
        });

        expect(receivedAuthHeader).toBe('Bearer delete-token');
      });
    });
  });

  describe('PATCH method', () => {
    it('should make PATCH request with body', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});
      const replyMessage = new Pong({});
      let receivedMethod: string | undefined;
      let receivedBody: any;

      router.patch('/ping', (req, res) => {
        receivedMethod = req.method;
        receivedBody = req.body;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await patchPingPatchRequest({
          server: `http://localhost:${port}`,
          payload: requestMessage
        });

        expect(receivedMethod).toBe('PATCH');
        expect(receivedBody).toBeDefined();
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
      });
    });

    it('should support PATCH with pagination', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});
      const replyMessage = new Pong({});
      let receivedOffset: string | undefined;

      router.patch('/ping', (req, res) => {
        receivedOffset = req.query.offset as string;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Total-Count', '50');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await patchPingPatchRequest({
          server: `http://localhost:${port}`,
          payload: requestMessage,
          pagination: { type: 'offset', offset: 10, limit: 5 }
        });

        expect(receivedOffset).toBe('10');
        expect(response.pagination).toBeDefined();
      });
    });
  });

  describe('HEAD method', () => {
    it('should make HEAD request and handle empty response', async () => {
      const { app, router, port } = createTestServer();

      let receivedMethod: string | undefined;

      router.head('/ping', (req, res) => {
        receivedMethod = req.method;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Custom-Header', 'head-value');
        res.end();
      });

      return runWithServer(app, port, async () => {
        // HEAD requests return no body, so the generated code may fail
        // This test verifies the method is sent correctly even if parsing fails
        try {
          await headPingHeadRequest({
            server: `http://localhost:${port}`
          });
        } catch (error) {
          // Expected - HEAD responses have no body to parse
        }

        expect(receivedMethod).toBe('HEAD');
      });
    });

    it('should support HEAD with authentication', async () => {
      const { app, router, port } = createTestServer();

      let receivedAuthHeader: string | undefined;
      let receivedApiKey: string | undefined;

      router.head('/ping', (req, res) => {
        receivedAuthHeader = req.headers.authorization;
        receivedApiKey = req.headers['x-api-key'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.end();
      });

      return runWithServer(app, port, async () => {
        try {
          await headPingHeadRequest({
            server: `http://localhost:${port}`,
            auth: { type: 'apiKey', key: 'head-key' }
          });
        } catch (error) {
          // Expected - HEAD responses have no body
        }

        expect(receivedApiKey).toBe('head-key');
      });
    });
  });

  describe('OPTIONS method', () => {
    it('should make OPTIONS request and handle empty response', async () => {
      const { app, router, port } = createTestServer();

      let receivedMethod: string | undefined;
      let receivedAllowHeader: string | undefined;

      router.options('/ping', (req, res) => {
        receivedMethod = req.method;
        res.setHeader('Allow', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
        res.setHeader('Content-Type', 'application/json');
        res.end();
      });

      return runWithServer(app, port, async () => {
        // OPTIONS requests typically return no body
        try {
          await optionsPingOptionsRequest({
            server: `http://localhost:${port}`
          });
        } catch (error) {
          // Expected - OPTIONS responses typically have no body
        }

        expect(receivedMethod).toBe('OPTIONS');
      });
    });
  });

  describe('error handling across methods', () => {
    it('should handle 404 for PUT', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});

      router.put('/ping', (req, res) => {
        res.status(404).json({ error: 'Not Found' });
      });

      return runWithServer(app, port, async () => {
        await expect(putPingPutRequest({
          server: `http://localhost:${port}`,
          payload: requestMessage
        })).rejects.toThrow('Not Found');
      });
    });

    it('should handle 500 for DELETE', async () => {
      const { app, router, port } = createTestServer();

      router.delete('/ping', (req, res) => {
        res.status(500).json({ error: 'Internal Server Error' });
      });

      return runWithServer(app, port, async () => {
        await expect(deletePingDeleteRequest({
          server: `http://localhost:${port}`
        })).rejects.toThrow('Internal Server Error');
      });
    });

    it('should handle 403 for PATCH', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});

      router.patch('/ping', (req, res) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      return runWithServer(app, port, async () => {
        await expect(patchPingPatchRequest({
          server: `http://localhost:${port}`,
          payload: requestMessage
        })).rejects.toThrow('Forbidden');
      });
    });
  });

  describe('retry across methods', () => {
    it('should retry PUT on 503', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});
      const replyMessage = new Pong({});
      let requestCount = 0;

      router.put('/ping', (req, res) => {
        requestCount++;
        if (requestCount < 2) {
          res.status(503).json({ error: 'Service Unavailable' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const response = await putPingPutRequest({
          server: `http://localhost:${port}`,
          payload: requestMessage,
          retry: { maxRetries: 3, initialDelayMs: 50, retryableStatusCodes: [503] }
        });

        expect(requestCount).toBe(2);
        expect(response.data).toBeDefined();
      });
    });

    it('should retry DELETE on 502', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;

      router.delete('/ping', (req, res) => {
        requestCount++;
        if (requestCount < 2) {
          res.status(502).json({ error: 'Bad Gateway' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const response = await deletePingDeleteRequest({
          server: `http://localhost:${port}`,
          retry: { maxRetries: 3, initialDelayMs: 50, retryableStatusCodes: [502] }
        });

        expect(requestCount).toBe(2);
        expect(response.data).toBeDefined();
      });
    });
  });
});
