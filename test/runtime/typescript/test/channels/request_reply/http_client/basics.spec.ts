/* eslint-disable no-console */
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import { Ping } from "../../../../src/request-reply/payloads/Ping";
import { createTestServer, runWithServer } from './test-utils';
import {
  postPingPostRequest,
  getPingGetRequest,
} from '../../../../src/request-reply/channels/http_client';

jest.setTimeout(15000);

describe('HTTP Client - Basics', () => {
  describe('response wrapper', () => {
    it('should return HttpClientResponse with data, headers, and rawData', async () => {
      const { app, router, port } = createTestServer();

      const requestMessage = new Ping({});
      const replyMessage = new Pong({ additionalProperties: new Map([['test', true]]) });

      router.post('/ping', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Custom-Header', 'test-value');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await postPingPostRequest({
          payload: requestMessage,
          server: `http://localhost:${port}`
        });

        expect(response.data).toBeDefined();
        expect(response.data.marshal()).toEqual(replyMessage.marshal());
        expect(response.status).toBe(200);
        expect(response.statusText).toBe('OK');
        expect(response.headers).toBeDefined();
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.rawData).toBeDefined();
      });
    });

    it('should include pagination info from response headers', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({ additionalProperties: new Map([['page', 1]]) });

      router.get('/ping', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Total-Count', '100');
        res.setHeader('X-Has-More', 'true');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination: { type: 'offset', offset: 0, limit: 20 }
        });

        expect(response.pagination).toBeDefined();
        expect(response.pagination?.totalCount).toBe(100);
        expect(response.pagination?.hasMore).toBe(true);
        expect(response.pagination?.currentOffset).toBe(0);
        expect(response.pagination?.limit).toBe(20);
      });
    });
  });

  describe('query parameters', () => {
    it('should add query parameters to URL', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedFilter: string | undefined;
      let receivedSort: string | undefined;

      router.get('/ping', (req, res) => {
        receivedFilter = req.query.filter as string;
        receivedSort = req.query.sort as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        await getPingGetRequest({
          server: `http://localhost:${port}`,
          queryParams: {
            filter: 'active',
            sort: 'name'
          }
        });

        expect(receivedFilter).toBe('active');
        expect(receivedSort).toBe('name');
      });
    });
  });

  describe('error handling', () => {
    it('should throw standardized error for 401', async () => {
      const { app, router, port } = createTestServer();

      router.get('/ping', (req, res) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      return runWithServer(app, port, async () => {
        await expect(getPingGetRequest({
          server: `http://localhost:${port}`
        })).rejects.toThrow('Unauthorized');
      });
    });

    it('should throw standardized error for 403', async () => {
      const { app, router, port } = createTestServer();

      router.get('/ping', (req, res) => {
        res.status(403).json({ error: 'Forbidden' });
      });

      return runWithServer(app, port, async () => {
        await expect(getPingGetRequest({
          server: `http://localhost:${port}`
        })).rejects.toThrow('Forbidden');
      });
    });

    it('should throw standardized error for 404', async () => {
      const { app, router, port } = createTestServer();

      router.get('/ping', (req, res) => {
        res.status(404).json({ error: 'Not Found' });
      });

      return runWithServer(app, port, async () => {
        await expect(getPingGetRequest({
          server: `http://localhost:${port}`
        })).rejects.toThrow('Not Found');
      });
    });

    it('should throw standardized error for 500', async () => {
      const { app, router, port } = createTestServer();

      router.get('/ping', (req, res) => {
        res.status(500).json({ error: 'Internal Server Error' });
      });

      return runWithServer(app, port, async () => {
        await expect(getPingGetRequest({
          server: `http://localhost:${port}`
        })).rejects.toThrow('Internal Server Error');
      });
    });
  });
});
