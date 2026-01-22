/* eslint-disable no-console */
import { createTestServer, runWithServer } from './test-utils';
import {
  postAddPet,
  putUpdatePet,
  getFindPetsByStatusAndCategory,
} from '../../../../src/openapi/channels/http_client';
import { APet } from '../../../../src/openapi/payloads/APet';
import { FindPetsByStatusAndCategoryParameters } from '../../../../src/openapi/parameters/FindPetsByStatusAndCategoryParameters';

jest.setTimeout(15000);

describe('HTTP Client - OpenAPI Generated', () => {
  describe('POST request with body', () => {
    it('should send POST request with request body and parse response', async () => {
      const { app, router, port } = createTestServer();

      const requestPet = new APet({ name: 'Fluffy', photoUrls: ['http://example.com/fluffy.jpg'] });
      const responsePet = new APet({ id: 1, name: 'Fluffy', photoUrls: ['http://example.com/fluffy.jpg'] });

      let receivedBody: any;
      router.post('/pet', (req, res) => {
        receivedBody = req.body;
        res.setHeader('Content-Type', 'application/json');
        res.write(responsePet.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await postAddPet({
          payload: requestPet,
          server: `http://localhost:${port}`
        });

        expect(response.data).toBeDefined();
        expect(response.status).toBe(200);
        expect(receivedBody).toBeDefined();
        expect(receivedBody.name).toBe('Fluffy');
      });
    });
  });

  describe('PUT request with body', () => {
    it('should send PUT request with request body', async () => {
      const { app, router, port } = createTestServer();

      const requestPet = new APet({ id: 1, name: 'Fluffy Updated', photoUrls: [] });
      const responsePet = new APet({ id: 1, name: 'Fluffy Updated', photoUrls: [] });

      let receivedMethod: string | undefined;
      router.put('/pet', (req, res) => {
        receivedMethod = req.method;
        res.setHeader('Content-Type', 'application/json');
        res.write(responsePet.marshal());
        res.end();
      });

      return runWithServer(app, port, async () => {
        const response = await putUpdatePet({
          payload: requestPet,
          server: `http://localhost:${port}`
        });

        expect(receivedMethod).toBe('PUT');
        expect(response.status).toBe(200);
      });
    });
  });

  describe('GET request with path parameters', () => {
    it('should construct URL with path parameters', async () => {
      const { app, router, port } = createTestServer();

      const responsePets = [new APet({ id: 1, name: 'Fluffy', photoUrls: [] })];
      let receivedPath: string | undefined;

      // Register route with Express path parameters
      router.get('/pet/findByStatus/:status/:categoryId', (req, res) => {
        receivedPath = req.path;
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(responsePets.map(p => JSON.parse(p.marshal()))));
        res.end();
      });

      return runWithServer(app, port, async () => {
        const params = new FindPetsByStatusAndCategoryParameters({
          status: 'available',
          categoryId: 123
        });

        const response = await getFindPetsByStatusAndCategory({
          parameters: params,
          server: `http://localhost:${port}`
        });

        expect(receivedPath).toContain('available');
        expect(receivedPath).toContain('123');
        expect(response.status).toBe(200);
      });
    });
  });

  describe('error handling', () => {
    it('should throw error for 400 response', async () => {
      const { app, router, port } = createTestServer();

      router.post('/pet', (req, res) => {
        res.status(400).json({ error: 'Bad Request' });
      });

      return runWithServer(app, port, async () => {
        const pet = new APet({ name: 'Test', photoUrls: [] });
        await expect(postAddPet({
          payload: pet,
          server: `http://localhost:${port}`
        })).rejects.toThrow();
      });
    });

    it('should throw error for 404 response', async () => {
      const { app, router, port } = createTestServer();

      router.get('/pet/findByStatus/:status/:categoryId', (req, res) => {
        res.status(404).json({ error: 'Not Found' });
      });

      return runWithServer(app, port, async () => {
        const params = new FindPetsByStatusAndCategoryParameters({
          status: 'invalid',
          categoryId: 999
        });

        await expect(getFindPetsByStatusAndCategory({
          parameters: params,
          server: `http://localhost:${port}`
        })).rejects.toThrow('Not Found');
      });
    });
  });
});
