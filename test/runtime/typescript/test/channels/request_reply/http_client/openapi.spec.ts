/* eslint-disable no-console */
import { createTestServer, runWithServer } from './test-utils';
import {
  addPet,
  updatePet,
  findPetsByStatusAndCategory,
  HttpError,
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

      return runWithServer(app, port, async (_server, actualPort) => {
        const response = await addPet({
          payload: requestPet,
          baseUrl: `http://localhost:${actualPort}`
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

      return runWithServer(app, port, async (_server, actualPort) => {
        const response = await updatePet({
          payload: requestPet,
          baseUrl: `http://localhost:${actualPort}`
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

      return runWithServer(app, port, async (_server, actualPort) => {
        const params = new FindPetsByStatusAndCategoryParameters({
          status: 'available',
          categoryId: 123
        });

        const response = await findPetsByStatusAndCategory({
          parameters: params,
          baseUrl: `http://localhost:${actualPort}`
        });

        expect(receivedPath).toContain('available');
        expect(receivedPath).toContain('123');
        expect(response.status).toBe(200);
      });
    });
  });

  describe('error handling', () => {
    // The OpenAPI client is input-driven: error status codes declared anywhere
    // in openapi-3.json (400, 404, 405) become explicit cases in the shared
    // handleHttpError, each throwing a typed HttpError whose message is the
    // standard HTTP reason phrase for that code.
    it('should throw a typed HttpError with the reason phrase for a declared 400', async () => {
      const { app, router, port } = createTestServer();

      router.post('/pet', (req, res) => {
        res.status(400).json({ error: 'invalid pet' });
      });

      return runWithServer(app, port, async (_server, actualPort) => {
        const pet = new APet({ name: 'Test', photoUrls: [] });
        const error = await addPet({
          payload: pet,
          baseUrl: `http://localhost:${actualPort}`
        }).catch((e) => e);

        expect(error).toBeInstanceOf(HttpError);
        expect(error.status).toBe(400);
        // 400 is declared in the input -> explicit case with reason phrase
        expect(error.message).toBe('Bad Request');
        expect(error.body).toEqual({ error: 'invalid pet' });
      });
    });

    it('should throw a typed HttpError with the reason phrase for a declared 404', async () => {
      const { app, router, port } = createTestServer();

      router.get('/pet/findByStatus/:status/:categoryId', (req, res) => {
        res.status(404).json({ error: 'no pets' });
      });

      return runWithServer(app, port, async (_server, actualPort) => {
        const params = new FindPetsByStatusAndCategoryParameters({
          status: 'invalid',
          categoryId: 999
        });

        const error = await findPetsByStatusAndCategory({
          parameters: params,
          baseUrl: `http://localhost:${actualPort}`
        }).catch((e) => e);

        expect(error).toBeInstanceOf(HttpError);
        expect(error.status).toBe(404);
        // 404 is declared in the input -> explicit case with reason phrase
        expect(error.message).toBe('Not Found');
        expect(error.body).toEqual({ error: 'no pets' });
      });
    });
  });
});
