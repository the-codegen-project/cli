/* eslint-disable no-console */
import { createTestServer, runWithServer } from './test-utils';
import {
  getGetUserItem,
  putUpdateUserItem,
} from '../../../../src/request-reply/channels/http_client';
import { UserItemsParameters } from "../../../../src/request-reply/parameters/UserItemsParameters";
import { ItemRequestHeaders } from "../../../../src/request-reply/headers/ItemRequestHeaders";
import { ItemRequest } from "../../../../src/request-reply/payloads/ItemRequest";

jest.setTimeout(15000);

describe('HTTP Client - Parameters and Headers', () => {
  describe('path parameters', () => {
    it('should replace path parameters in URL', async () => {
      const { app, router, port } = createTestServer();

      let receivedPath: string | undefined;

      router.get('/users/:userId/items/:itemId', (req, res) => {
        receivedPath = req.path;
        res.json({
          id: req.params.itemId,
          userId: req.params.userId,
          name: 'Test Item',
          quantity: 5
        });
      });

      return runWithServer(app, port, async () => {
        const parameters = new UserItemsParameters({
          userId: 'user-123',
          itemId: '456'
        });

        const response = await getGetUserItem({
          server: `http://localhost:${port}`,
          parameters
        });

        expect(receivedPath).toBe('/users/user-123/items/456');
        expect(response.data).toBeDefined();
      });
    });

    it('should work with different parameter values', async () => {
      const { app, router, port } = createTestServer();

      const receivedParams: { userId: string; itemId: string }[] = [];

      router.get('/users/:userId/items/:itemId', (req, res) => {
        receivedParams.push({
          userId: req.params.userId,
          itemId: req.params.itemId
        });
        res.json({
          id: req.params.itemId,
          userId: req.params.userId,
          name: 'Item',
          quantity: 1
        });
      });

      return runWithServer(app, port, async () => {
        await getGetUserItem({
          server: `http://localhost:${port}`,
          parameters: new UserItemsParameters({ userId: 'alice', itemId: '100' })
        });

        await getGetUserItem({
          server: `http://localhost:${port}`,
          parameters: new UserItemsParameters({ userId: 'bob', itemId: '200' })
        });

        expect(receivedParams).toEqual([
          { userId: 'alice', itemId: '100' },
          { userId: 'bob', itemId: '200' }
        ]);
      });
    });

    it('should combine parameters with authentication', async () => {
      const { app, router, port } = createTestServer();

      let receivedPath: string | undefined;
      let receivedAuthHeader: string | undefined;

      router.get('/users/:userId/items/:itemId', (req, res) => {
        receivedPath = req.path;
        receivedAuthHeader = req.headers.authorization;
        res.json({
          id: req.params.itemId,
          userId: req.params.userId,
          name: 'Secure Item',
          quantity: 10
        });
      });

      return runWithServer(app, port, async () => {
        const response = await getGetUserItem({
          server: `http://localhost:${port}`,
          parameters: new UserItemsParameters({ userId: 'secure-user', itemId: '999' }),
          auth: { type: 'bearer', token: 'secret-token' }
        });

        expect(receivedPath).toBe('/users/secure-user/items/999');
        expect(receivedAuthHeader).toBe('Bearer secret-token');
        expect(response.data).toBeDefined();
      });
    });

    it('should combine parameters with query params', async () => {
      const { app, router, port } = createTestServer();

      let receivedPath: string | undefined;
      let receivedQueryInclude: string | undefined;
      let receivedQueryFields: string | undefined;

      router.get('/users/:userId/items/:itemId', (req, res) => {
        receivedPath = req.path;
        receivedQueryInclude = req.query.include as string;
        receivedQueryFields = req.query.fields as string;
        res.json({
          id: req.params.itemId,
          userId: req.params.userId,
          name: 'Item with metadata',
          quantity: 1
        });
      });

      return runWithServer(app, port, async () => {
        await getGetUserItem({
          server: `http://localhost:${port}`,
          parameters: new UserItemsParameters({ userId: 'user1', itemId: '42' }),
          queryParams: {
            include: 'metadata',
            fields: 'name,quantity'
          }
        });

        expect(receivedPath).toBe('/users/user1/items/42');
        expect(receivedQueryInclude).toBe('metadata');
        expect(receivedQueryFields).toBe('name,quantity');
      });
    });
  });

  describe('typed headers', () => {
    it('should send typed headers in request', async () => {
      const { app, router, port } = createTestServer();

      let receivedCorrelationId: string | undefined;
      let receivedRequestId: string | undefined;

      router.put('/users/:userId/items/:itemId', (req, res) => {
        receivedCorrelationId = req.headers['x-correlation-id'] as string;
        receivedRequestId = req.headers['x-request-id'] as string;
        res.json({
          id: req.params.itemId,
          userId: req.params.userId,
          name: req.body.name,
          description: req.body.description,
          quantity: req.body.quantity
        });
      });

      return runWithServer(app, port, async () => {
        const headers = new ItemRequestHeaders({
          xCorrelationId: 'corr-123-abc',
          xRequestId: 'req-456-def'
        });

        const payload = new ItemRequest({
          name: 'Updated Item',
          description: 'New description',
          quantity: 25
        });

        const response = await putUpdateUserItem({
          server: `http://localhost:${port}`,
          parameters: new UserItemsParameters({ userId: 'user-1', itemId: '100' }),
          payload,
          requestHeaders: headers
        });

        expect(receivedCorrelationId).toBe('corr-123-abc');
        expect(receivedRequestId).toBe('req-456-def');
        expect(response.data).toBeDefined();
      });
    });

    it('should work with only required headers', async () => {
      const { app, router, port } = createTestServer();

      let receivedCorrelationId: string | undefined;
      let receivedRequestId: string | undefined;

      router.put('/users/:userId/items/:itemId', (req, res) => {
        receivedCorrelationId = req.headers['x-correlation-id'] as string;
        receivedRequestId = req.headers['x-request-id'] as string;
        res.json({
          id: req.params.itemId,
          userId: req.params.userId,
          name: req.body.name,
          quantity: req.body.quantity
        });
      });

      return runWithServer(app, port, async () => {
        const headers = new ItemRequestHeaders({
          xCorrelationId: 'required-only'
        });

        const payload = new ItemRequest({
          name: 'Minimal Item'
        });

        const response = await putUpdateUserItem({
          server: `http://localhost:${port}`,
          parameters: new UserItemsParameters({ userId: 'u1', itemId: '1' }),
          payload,
          requestHeaders: headers
        });

        expect(receivedCorrelationId).toBe('required-only');
        expect(receivedRequestId).toBeUndefined();
        expect(response.data).toBeDefined();
      });
    });

    it('should merge typed headers with additional headers', async () => {
      const { app, router, port } = createTestServer();

      let receivedCorrelationId: string | undefined;
      let receivedCustomHeader: string | undefined;

      router.put('/users/:userId/items/:itemId', (req, res) => {
        receivedCorrelationId = req.headers['x-correlation-id'] as string;
        receivedCustomHeader = req.headers['x-custom-header'] as string;
        res.json({
          id: req.params.itemId,
          userId: req.params.userId,
          name: req.body.name,
          quantity: 1
        });
      });

      return runWithServer(app, port, async () => {
        const response = await putUpdateUserItem({
          server: `http://localhost:${port}`,
          parameters: new UserItemsParameters({ userId: 'u', itemId: '1' }),
          payload: new ItemRequest({ name: 'Item' }),
          requestHeaders: new ItemRequestHeaders({ xCorrelationId: 'corr-id' }),
          additionalHeaders: {
            'X-Custom-Header': 'custom-value'
          }
        });

        expect(receivedCorrelationId).toBe('corr-id');
        expect(receivedCustomHeader).toBe('custom-value');
        expect(response.data).toBeDefined();
      });
    });

    it('should combine typed headers with auth', async () => {
      const { app, router, port } = createTestServer();

      let receivedCorrelationId: string | undefined;
      let receivedAuthHeader: string | undefined;

      router.put('/users/:userId/items/:itemId', (req, res) => {
        receivedCorrelationId = req.headers['x-correlation-id'] as string;
        receivedAuthHeader = req.headers.authorization;
        res.json({
          id: req.params.itemId,
          userId: req.params.userId,
          name: req.body.name,
          quantity: 1
        });
      });

      return runWithServer(app, port, async () => {
        await putUpdateUserItem({
          server: `http://localhost:${port}`,
          parameters: new UserItemsParameters({ userId: 'u', itemId: '1' }),
          payload: new ItemRequest({ name: 'Secure Item' }),
          requestHeaders: new ItemRequestHeaders({ xCorrelationId: 'secure-corr' }),
          auth: { type: 'bearer', token: 'auth-token' }
        });

        expect(receivedCorrelationId).toBe('secure-corr');
        expect(receivedAuthHeader).toBe('Bearer auth-token');
      });
    });
  });

  describe('full integration', () => {
    it('should handle full request with parameters, headers, payload, and auth', async () => {
      const { app, router, port } = createTestServer();

      let receivedData: {
        path: string;
        correlationId: string;
        requestId?: string;
        authHeader: string;
        body: any;
        query: any;
      } | undefined;

      router.put('/users/:userId/items/:itemId', (req, res) => {
        receivedData = {
          path: req.path,
          correlationId: req.headers['x-correlation-id'] as string,
          requestId: req.headers['x-request-id'] as string,
          authHeader: req.headers.authorization as string,
          body: req.body,
          query: req.query
        };

        res.json({
          id: req.params.itemId,
          userId: req.params.userId,
          name: req.body.name,
          description: req.body.description,
          quantity: req.body.quantity
        });
      });

      return runWithServer(app, port, async () => {
        const response = await putUpdateUserItem({
          server: `http://localhost:${port}`,
          parameters: new UserItemsParameters({ userId: 'full-user', itemId: '999' }),
          payload: new ItemRequest({
            name: 'Complete Item',
            description: 'Full test',
            quantity: 100
          }),
          requestHeaders: new ItemRequestHeaders({
            xCorrelationId: 'full-corr-id',
            xRequestId: 'full-req-id'
          }),
          auth: { type: 'basic', username: 'admin', password: 'secret' },
          queryParams: { verbose: 'true' }
        });

        expect(receivedData).toBeDefined();
        expect(receivedData?.path).toBe('/users/full-user/items/999');
        expect(receivedData?.correlationId).toBe('full-corr-id');
        expect(receivedData?.requestId).toBe('full-req-id');
        expect(receivedData?.authHeader).toContain('Basic');
        expect(receivedData?.body.name).toBe('Complete Item');
        expect(receivedData?.query.verbose).toBe('true');
        expect(response.status).toBe(200);
      });
    });

    it('should handle 404 response with parameters', async () => {
      const { app, router, port } = createTestServer();

      router.get('/users/:userId/items/:itemId', (req, res) => {
        res.status(404).json({
          error: 'Item not found',
          code: 'ITEM_NOT_FOUND'
        });
      });

      return runWithServer(app, port, async () => {
        const parameters = new UserItemsParameters({
          userId: 'user-1',
          itemId: 'non-existent'
        });

        try {
          const response = await getGetUserItem({
            server: `http://localhost:${port}`,
            parameters
          });
          expect(response.status).toBe(404);
        } catch (error) {
          expect((error as Error).message).toContain('Not Found');
        }
      });
    });
  });
});
