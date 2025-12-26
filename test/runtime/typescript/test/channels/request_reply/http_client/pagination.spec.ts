/* eslint-disable no-console */
import { Pong } from "../../../../src/request-reply/payloads/Pong";
import { createTestServer, runWithServer } from './test-utils';
import {
  getPingGetRequest,
  PaginationConfig,
} from '../../../../src/request-reply/channels/http_client';

jest.setTimeout(15000);

describe('HTTP Client - Pagination', () => {
  describe('offset pagination', () => {
    it('should add offset pagination params to query string', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedOffset: string | undefined;
      let receivedLimit: string | undefined;

      router.get('/ping', (req, res) => {
        receivedOffset = req.query.offset as string;
        receivedLimit = req.query.limit as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const pagination: PaginationConfig = {
          type: 'offset',
          offset: 20,
          limit: 10
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination
        });

        expect(receivedOffset).toBe('20');
        expect(receivedLimit).toBe('10');
      });
    });

    it('should add pagination params to headers when in: header', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedOffsetHeader: string | undefined;
      let receivedLimitHeader: string | undefined;

      router.get('/ping', (req, res) => {
        receivedOffsetHeader = req.headers['x-offset'] as string;
        receivedLimitHeader = req.headers['x-limit'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const pagination: PaginationConfig = {
          type: 'offset',
          in: 'header',
          offset: 50,
          limit: 25
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination
        });

        expect(receivedOffsetHeader).toBe('50');
        expect(receivedLimitHeader).toBe('25');
      });
    });

    it('should use custom pagination param names', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedSkip: string | undefined;
      let receivedTake: string | undefined;

      router.get('/ping', (req, res) => {
        receivedSkip = req.query.skip as string;
        receivedTake = req.query.take as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const pagination: PaginationConfig = {
          type: 'offset',
          offset: 100,
          limit: 50,
          offsetParam: 'skip',
          limitParam: 'take'
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination
        });

        expect(receivedSkip).toBe('100');
        expect(receivedTake).toBe('50');
      });
    });
  });

  describe('cursor pagination', () => {
    it('should add cursor pagination params', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedCursor: string | undefined;
      let receivedLimit: string | undefined;

      router.get('/ping', (req, res) => {
        receivedCursor = req.query.cursor as string;
        receivedLimit = req.query.limit as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const pagination: PaginationConfig = {
          type: 'cursor',
          cursor: 'abc123xyz',
          limit: 15
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination
        });

        expect(receivedCursor).toBe('abc123xyz');
        expect(receivedLimit).toBe('15');
      });
    });

    it('should handle cursor-based pagination with next cursor from headers', async () => {
      const { app, router, port } = createTestServer();

      const cursors: (string | undefined)[] = [];

      router.get('/ping', (req, res) => {
        const cursor = req.query.cursor as string | undefined;
        cursors.push(cursor);

        const replyMessage = new Pong({});
        res.setHeader('Content-Type', 'application/json');

        if (!cursor) {
          res.setHeader('X-Next-Cursor', 'cursor-page-2');
        } else if (cursor === 'cursor-page-2') {
          res.setHeader('X-Next-Cursor', 'cursor-page-3');
        }

        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const page1 = await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination: { type: 'cursor', limit: 10 }
        });

        expect(page1.pagination?.nextCursor).toBe('cursor-page-2');
        expect(page1.hasNextPage?.()).toBe(true);

        const page2 = await page1.getNextPage!();
        expect(page2.pagination?.nextCursor).toBe('cursor-page-3');

        const page3 = await page2.getNextPage!();
        expect(page3.pagination?.nextCursor).toBeUndefined();
        expect(page3.hasNextPage?.()).toBe(false);

        expect(cursors).toEqual([undefined, 'cursor-page-2', 'cursor-page-3']);
      });
    });
  });

  describe('page pagination', () => {
    it('should add page-based pagination params', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedPage: string | undefined;
      let receivedPageSize: string | undefined;

      router.get('/ping', (req, res) => {
        receivedPage = req.query.page as string;
        receivedPageSize = req.query.pageSize as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const pagination: PaginationConfig = {
          type: 'page',
          page: 3,
          pageSize: 25
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination
        });

        expect(receivedPage).toBe('3');
        expect(receivedPageSize).toBe('25');
      });
    });
  });

  describe('range pagination', () => {
    it('should add Range header for range pagination', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});
      let receivedRangeHeader: string | undefined;

      router.get('/ping', (req, res) => {
        receivedRangeHeader = req.headers['range'] as string;
        res.setHeader('Content-Type', 'application/json');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const pagination: PaginationConfig = {
          type: 'range',
          start: 0,
          end: 24,
          unit: 'items'
        };

        await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination
        });

        expect(receivedRangeHeader).toBe('items=0-24');
      });
    });

    it('should handle range pagination for page navigation', async () => {
      const { app, router, port } = createTestServer();

      const ranges: string[] = [];

      router.get('/ping', (req, res) => {
        ranges.push(req.headers['range'] as string);
        const replyMessage = new Pong({});
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Total-Count', '100');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const page1 = await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination: { type: 'range', start: 0, end: 24, unit: 'items' }
        });

        expect(page1.hasNextPage?.()).toBe(true);

        await page1.getNextPage!();

        expect(ranges).toEqual(['items=0-24', 'items=25-49']);
      });
    });
  });

  describe('pagination helpers', () => {
    it('should provide pagination helpers when pagination is configured', async () => {
      const { app, router, port } = createTestServer();

      const replyMessage = new Pong({});

      router.get('/ping', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Total-Count', '100');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination: { type: 'offset', offset: 0, limit: 20 }
        });

        expect(response.hasNextPage).toBeDefined();
        expect(response.hasPrevPage).toBeDefined();
        expect(response.getNextPage).toBeDefined();
        expect(response.getPrevPage).toBeDefined();
        expect(response.hasNextPage?.()).toBe(true);
        expect(response.hasPrevPage?.()).toBe(false);
      });
    });

    it('should navigate through pages with getNextPage', async () => {
      const { app, router, port } = createTestServer();

      let requestCount = 0;
      const offsets: string[] = [];

      router.get('/ping', (req, res) => {
        requestCount++;
        offsets.push(req.query.offset as string);
        const replyMessage = new Pong({ additionalProperties: new Map([['page', requestCount]]) });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Total-Count', '100');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const page1 = await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination: { type: 'offset', offset: 0, limit: 20 }
        });

        expect(page1.hasNextPage?.()).toBe(true);

        const page2 = await page1.getNextPage!();
        expect(page2.pagination?.currentOffset).toBe(20);

        const page3 = await page2.getNextPage!();
        expect(page3.pagination?.currentOffset).toBe(40);

        expect(requestCount).toBe(3);
        expect(offsets).toEqual(['0', '20', '40']);
      });
    });

    it('should navigate backwards with getPrevPage', async () => {
      const { app, router, port } = createTestServer();

      const offsets: string[] = [];

      router.get('/ping', (req, res) => {
        offsets.push(req.query.offset as string);
        const replyMessage = new Pong({});
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Total-Count', '100');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const page = await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination: { type: 'offset', offset: 60, limit: 20 }
        });

        expect(page.hasPrevPage?.()).toBe(true);

        const prevPage = await page.getPrevPage!();
        expect(prevPage.pagination?.currentOffset).toBe(40);

        expect(offsets).toEqual(['60', '40']);
      });
    });

    it('should parse Link header for pagination info', async () => {
      const { app, router, port } = createTestServer();

      router.get('/ping', (req, res) => {
        const replyMessage = new Pong({});
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Link', '<http://api.example.com/items?page=2>; rel="next", <http://api.example.com/items?page=5>; rel="last"');
        res.write(replyMessage.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await getPingGetRequest({
          server: `http://localhost:${port}`,
          pagination: { type: 'page', page: 1, pageSize: 20 }
        });

        expect(response.pagination?.hasMore).toBe(true);
      });
    });
  });
});
