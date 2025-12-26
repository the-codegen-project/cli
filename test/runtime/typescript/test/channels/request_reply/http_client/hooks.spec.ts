/* eslint-disable no-console */
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import { createTestServer, runWithServer } from './test-utils';
import {
  getPingGetRequest,
  HttpHooks,
  RetryConfig,
} from '../../../../src/request-reply/channels/http_client';

jest.setTimeout(15000);

describe('HTTP Client - Hooks', () => {
  describe('beforeRequest hook', () => {
    it('should call beforeRequest hook and modify request', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedCustomHeader: string | undefined;

      router.get('/ping', (req, res) => {
        receivedCustomHeader = req.headers['x-custom-hook-header'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          beforeRequest: (params) => ({
            ...params,
            headers: {
              ...params.headers,
              'X-Custom-Hook-Header': 'hook-value'
            }
          })
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks
        });

        expect(receivedCustomHeader).toBe('hook-value');
      });
    });

    it('should support async beforeRequest hook', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedTimestamp: string | undefined;

      router.get('/ping', (req, res) => {
        receivedTimestamp = req.headers['x-timestamp'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          beforeRequest: async (params) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return {
              ...params,
              headers: {
                ...params.headers,
                'X-Timestamp': Date.now().toString()
              }
            };
          }
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks
        });

        expect(receivedTimestamp).toBeDefined();
        expect(parseInt(receivedTimestamp!)).toBeGreaterThan(0);
      });
    });

    it('should use beforeRequest hook to add authentication', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedAuthHeader: string | undefined;

      router.get('/ping', (req, res) => {
        receivedAuthHeader = req.headers.authorization;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          beforeRequest: (params) => ({
            ...params,
            headers: {
              ...params.headers,
              'Authorization': 'Bearer token-from-hook'
            }
          })
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks
        });

        expect(receivedAuthHeader).toBe('Bearer token-from-hook');
      });
    });

    it('should modify URL in beforeRequest hook', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedPath: string | undefined;

      router.get('/custom-path', (req, res) => {
        receivedPath = req.path;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          beforeRequest: (params) => ({
            ...params,
            url: params.url.replace('/ping', '/custom-path')
          })
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks
        });

        expect(receivedPath).toBe('/custom-path');
      });
    });
  });

  describe('afterResponse hook', () => {
    it('should call afterResponse hook', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let afterResponseCalled = false;
      let capturedStatus: number | undefined;

      router.get('/ping', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          afterResponse: (response, params) => {
            afterResponseCalled = true;
            capturedStatus = response.status;
            return response;
          }
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks
        });

        expect(afterResponseCalled).toBe(true);
        expect(capturedStatus).toBe(200);
      });
    });

    it('should capture request/response with afterResponse for logging', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      const logEntries: { url: string; status: number; duration: number }[] = [];

      router.get('/ping', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        let startTime: number;

        const hooks: HttpHooks = {
          beforeRequest: (params) => {
            startTime = Date.now();
            return params;
          },
          afterResponse: (response, params) => {
            logEntries.push({
              url: params.url,
              status: response.status,
              duration: Date.now() - startTime
            });
            return response;
          }
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks
        });

        expect(logEntries.length).toBe(1);
        expect(logEntries[0].url).toContain('/ping');
        expect(logEntries[0].status).toBe(200);
        expect(logEntries[0].duration).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('onError hook', () => {
    it('should call onError hook on failure', async () => {
      const { app, router, port } = createTestServer();

      let onErrorCalled = false;
      let capturedError: Error | undefined;

      router.get('/ping', (req, res) => {
        res.status(404).json({ error: 'Not Found' });
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          onError: (error, params) => {
            onErrorCalled = true;
            capturedError = error;
            return error;
          }
        };

        try {
          await getPingGetRequest({
            server: `http://localhost:${port}`,
            hooks
          });
        } catch (error) {
          // Expected to throw
        }

        expect(onErrorCalled).toBe(true);
        expect(capturedError?.message).toBe('Not Found');
      });
    });

    it('should transform error in onError hook', async () => {
      const { app, router, port } = createTestServer();

      router.get('/ping', (req, res) => {
        res.status(503).json({ error: 'Service Unavailable', retryAfter: 60 });
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          onError: (error, params) => {
            const enhancedError = new Error(`Request to ${params.url} failed: ${error.message}`);
            return enhancedError;
          }
        };

        await expect(getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks
        })).rejects.toThrow(/Request to.*failed/);
      });
    });

    it('should handle async onError hook', async () => {
      const { app, router, port } = createTestServer();

      let asyncOperationCompleted = false;

      router.get('/ping', (req, res) => {
        res.status(500).json({ error: 'Server Error' });
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          onError: async (error, params) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            asyncOperationCompleted = true;
            return error;
          }
        };

        try {
          await getPingGetRequest({
            server: `http://localhost:${port}`,
            hooks
          });
        } catch (error) {
          // Expected
        }

        expect(asyncOperationCompleted).toBe(true);
      });
    });
  });

  describe('makeRequest hook', () => {
    it('should allow custom makeRequest implementation', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let customMakeRequestCalled = false;

      router.get('/ping', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          makeRequest: async (params) => {
            customMakeRequestCalled = true;
            const NodeFetch = await import('node-fetch');
            return NodeFetch.default(params.url, {
              method: params.method,
              headers: params.headers,
              body: params.body
            }) as any;
          }
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks
        });

        expect(customMakeRequestCalled).toBe(true);
        expect(response.data.marshal()).toEqual(replyMessage.marshal());
      });
    });
  });

  describe('combined hooks', () => {
    it('should use all hooks together', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      const hookCalls: string[] = [];

      router.get('/ping', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          beforeRequest: (params) => {
            hookCalls.push('beforeRequest');
            return params;
          },
          makeRequest: async (params) => {
            hookCalls.push('makeRequest');
            const NodeFetch = await import('node-fetch');
            return NodeFetch.default(params.url, {
              method: params.method,
              headers: params.headers,
              body: params.body
            }) as any;
          },
          afterResponse: (response, params) => {
            hookCalls.push('afterResponse');
            return response;
          }
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks
        });

        expect(hookCalls).toEqual(['beforeRequest', 'makeRequest', 'afterResponse']);
      });
    });

    it('should work with hooks and retry together', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;
      const hookCalls: string[] = [];

      router.get('/ping', (req, res) => {
        requestCount++;
        if (requestCount < 2) {
          res.status(500).json({ error: 'Server Error' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          beforeRequest: (params) => {
            hookCalls.push('beforeRequest');
            return params;
          },
          afterResponse: (response, params) => {
            hookCalls.push(`afterResponse-${response.status}`);
            return response;
          }
        };

        const retry: RetryConfig = {
          maxRetries: 2,
          initialDelayMs: 50,
          retryableStatusCodes: [500]
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks,
          retry
        });

        expect(hookCalls).toContain('beforeRequest');
        expect(hookCalls).toContain('afterResponse-200');
        expect(requestCount).toBe(2);
      });
    });

    it('should work with hooks and pagination', async () => {
      const { app, router, port } = createTestServer();

      const hookCalls: { method: string; offset?: string }[] = [];

      router.get('/ping', (req, res) => {
        const replyMessage = new Pong({});
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Total-Count', '60');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const hooks: HttpHooks = {
          beforeRequest: (params) => {
            const url = new URL(params.url);
            hookCalls.push({
              method: params.method,
              offset: url.searchParams.get('offset') || undefined
            });
            return params;
          }
        };

        const page1 = await getPingGetRequest({
          server: `http://localhost:${port}`,
          hooks,
          pagination: { type: 'offset', offset: 0, limit: 20 }
        });

        await page1.getNextPage!();

        expect(hookCalls.length).toBe(2);
        expect(hookCalls[0].offset).toBe('0');
        expect(hookCalls[1].offset).toBe('20');
      });
    });
  });
});
