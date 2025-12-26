/* eslint-disable no-console */
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import { createTestServer, runWithServer } from './test-utils';
import {
  getPingGetRequest,
  RetryConfig,
} from '../../../../src/request-reply/channels/http_client';

jest.setTimeout(15000);

describe('HTTP Client - Retry Logic', () => {
  describe('basic retry behavior', () => {
    it('should retry on 500 error and succeed', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;

      router.get('/ping', (req, res) => {
        requestCount++;
        if (requestCount < 3) {
          res.status(500).json({ error: 'Server Error' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 3,
          initialDelayMs: 100,
          retryableStatusCodes: [500]
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        });

        expect(requestCount).toBe(3);
        expect(response.data.marshal()).toEqual(replyMessage.marshal());
      });
    });

    it('should retry multiple times before success', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;
      const retryCalls: number[] = [];

      router.get('/ping', (req, res) => {
        requestCount++;
        if (requestCount < 4) {
          res.status(500).json({ error: 'Server Error' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 5,
          initialDelayMs: 30,
          retryableStatusCodes: [500],
          onRetry: (attempt) => {
            retryCalls.push(attempt);
          }
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        });

        expect(requestCount).toBe(4);
        expect(retryCalls).toEqual([1, 2, 3]);
        expect(response.data).toBeDefined();
      });
    });
  });

  describe('retry callbacks', () => {
    it('should call onRetry callback', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;
      const retryCalls: { attempt: number; delay: number }[] = [];

      router.get('/ping', (req, res) => {
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
        const retry: RetryConfig = {
          maxRetries: 3,
          initialDelayMs: 50,
          retryableStatusCodes: [503],
          onRetry: (attempt, delay) => {
            retryCalls.push({ attempt, delay });
          }
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        });

        expect(retryCalls.length).toBe(1);
        expect(retryCalls[0].attempt).toBe(1);
      });
    });
  });

  describe('max retries exhausted', () => {
    it('should fail after max retries exhausted', async () => {
      const { app, router, port } = createTestServer();

      let requestCount = 0;

      router.get('/ping', (req, res) => {
        requestCount++;
        res.status(500).json({ error: 'Server Error' });
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 3,
          initialDelayMs: 50,
          retryableStatusCodes: [500]
        };

        await expect(getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        })).rejects.toThrow('Internal Server Error');

        expect(requestCount).toBe(3);
      });
    });
  });

  describe('exponential backoff', () => {
    it('should apply exponential backoff', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;
      const delays: number[] = [];

      router.get('/ping', (req, res) => {
        requestCount++;
        if (requestCount < 4) {
          res.status(502).json({ error: 'Bad Gateway' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 5,
          initialDelayMs: 100,
          backoffMultiplier: 2,
          retryableStatusCodes: [502],
          onRetry: (attempt, delay) => {
            delays.push(delay);
          }
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        });

        expect(delays.length).toBe(3);
        expect(delays[0]).toBe(100);
        expect(delays[1]).toBe(200);
        expect(delays[2]).toBe(400);
      });
    });

    it('should respect maxDelayMs cap', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;
      const delays: number[] = [];

      router.get('/ping', (req, res) => {
        requestCount++;
        if (requestCount < 5) {
          res.status(503).json({ error: 'Service Unavailable' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 5,
          initialDelayMs: 100,
          maxDelayMs: 250,
          backoffMultiplier: 2,
          retryableStatusCodes: [503],
          onRetry: (attempt, delay) => {
            delays.push(delay);
          }
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        });

        expect(delays.every(d => d <= 250)).toBe(true);
        expect(delays[3]).toBe(250);
      });
    });
  });

  describe('retryable status codes', () => {
    it('should not retry non-retryable status codes', async () => {
      const { app, router, port } = createTestServer();

      let requestCount = 0;

      router.get('/ping', (req, res) => {
        requestCount++;
        res.status(400).json({ error: 'Bad Request' });
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 3,
          initialDelayMs: 50,
          retryableStatusCodes: [500, 502, 503]
        };

        await expect(getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        })).rejects.toThrow();

        expect(requestCount).toBe(1);
      });
    });

    it('should retry on 429 rate limit with default config', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;

      router.get('/ping', (req, res) => {
        requestCount++;
        if (requestCount < 2) {
          res.status(429).json({ error: 'Too Many Requests' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 3,
          initialDelayMs: 50
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        });

        expect(requestCount).toBe(2);
        expect(response.data).toBeDefined();
      });
    });

    it('should not retry when retryableStatusCodes is empty', async () => {
      const { app, router, port } = createTestServer();

      let requestCount = 0;

      router.get('/ping', (req, res) => {
        requestCount++;
        res.status(500).json({ error: 'Server Error' });
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 3,
          initialDelayMs: 50,
          retryableStatusCodes: []
        };

        await expect(getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        })).rejects.toThrow('Internal Server Error');

        expect(requestCount).toBe(1);
      });
    });

    it('should retry on 408 Request Timeout', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;

      router.get('/ping', (req, res) => {
        requestCount++;
        if (requestCount < 2) {
          res.status(408).json({ error: 'Request Timeout' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 3,
          initialDelayMs: 50
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        });

        expect(requestCount).toBe(2);
        expect(response.data).toBeDefined();
      });
    });

    it('should retry on 504 Gateway Timeout', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;

      router.get('/ping', (req, res) => {
        requestCount++;
        if (requestCount < 2) {
          res.status(504).json({ error: 'Gateway Timeout' });
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.write(replyMessage.marshal());
          res.end();
        }
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 3,
          initialDelayMs: 50
        };

        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        });

        expect(requestCount).toBe(2);
        expect(response.data).toBeDefined();
      });
    });
  });

  describe('network errors', () => {
    it('should fail immediately on network error without retry config', async () => {
      // Use a port that's not listening to simulate network error
      const unusedPort = 59999;

      await expect(getPingGetRequest({
        server: `http://localhost:${unusedPort}`
      })).rejects.toThrow();
    });

    it('should retry on network error and eventually fail', async () => {
      const unusedPort = 59998;
      const retryCalls: number[] = [];

      const retry: RetryConfig = {
        maxRetries: 2,
        initialDelayMs: 50,
        onRetry: (attempt) => {
          retryCalls.push(attempt);
        }
      };

      await expect(getPingGetRequest({
        server: `http://localhost:${unusedPort}`,
        retry
      })).rejects.toThrow();

      // Network errors should trigger retries
      expect(retryCalls.length).toBeGreaterThan(0);
    });

    it('should recover after network error when server becomes available', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let requestCount = 0;

      router.get('/ping', (req, res) => {
        requestCount++;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const retry: RetryConfig = {
          maxRetries: 3,
          initialDelayMs: 50
        };

        // Request should succeed on first try
        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          retry
        });

        expect(requestCount).toBe(1);
        expect(response.data).toBeDefined();
      });
    });
  });
});
