import express, {Express, Router} from 'express';
import {AddressInfo, Server} from 'http';
import {APet} from '../../../src/openapi-server/payloads/APet';
import {FindPetsByStatusAndCategoryParameters} from '../../../src/openapi-server/parameters/FindPetsByStatusAndCategoryParameters';
import {FindPetsByStatusAndCategoryHeaders} from '../../../src/openapi-server/headers/FindPetsByStatusAndCategoryHeaders';
import {
  HttpError,
  registerAddPet,
  registerFindPetsByStatusAndCategory,
  registerUpdatePet
} from '../../../src/openapi-server/channels/http_server';
import {
  addPet as addPetClient,
  findPetsByStatusAndCategory as findPetsByStatusAndCategoryClient
} from '../../../src/openapi-server/channels/http_client';

jest.setTimeout(15000);

/**
 * Boot an app on an OS-assigned port, run the test body against it, then close.
 */
function runWithServer(
  app: Express,
  testFn: (params: {baseUrl: string; port: number}) => Promise<void>
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const httpServer: Server = app.listen(0);
    httpServer.on('error', reject);
    httpServer.on('listening', async () => {
      const {port} = httpServer.address() as AddressInfo;
      try {
        await testFn({baseUrl: `http://localhost:${port}`, port});
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        httpServer.close();
      }
    });
  });
}

/** An app with `express.json()` mounted, the common production setup. */
function createJsonApp(): {app: Express; router: Router} {
  const router = Router();
  const app = express();
  app.use(express.json());
  app.use(router);
  return {app, router};
}

/** An app with NO body parser — proves `readJsonBody` reads the raw stream. */
function createBareApp(): {app: Express; router: Router} {
  const router = Router();
  const app = express();
  app.use(router);
  return {app, router};
}

const validPet = {
  id: 42,
  name: 'doggie',
  photoUrls: ['http://example.com/dog.png']
};

describe('HTTP Server - Basics', () => {
  describe('request body', () => {
    it('should hand the handler a typed body and marshal the returned payload', async () => {
      const {app, router} = createJsonApp();
      let receivedBody: APet | undefined;

      registerAddPet({
        router,
        callback: ({body}) => {
          receivedBody = body;
          return {status: 200, body};
        }
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(`${baseUrl}/pet`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(validPet)
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain(
          'application/json'
        );
        const roundTripped = APet.unmarshal(await response.text());
        expect(roundTripped.name).toEqual('doggie');
        expect(roundTripped.id).toEqual(42);
        expect(receivedBody).toBeInstanceOf(APet);
        expect(receivedBody?.photoUrls).toEqual([
          'http://example.com/dog.png'
        ]);
      });
    });

    it('should read the raw request stream when no body parser is mounted', async () => {
      const {app, router} = createBareApp();
      let receivedBody: APet | undefined;

      registerAddPet({
        router,
        callback: ({body}) => {
          receivedBody = body;
          return {status: 200, body};
        }
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(`${baseUrl}/pet`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(validPet)
        });

        expect(response.status).toBe(200);
        expect(receivedBody?.name).toEqual('doggie');
      });
    });

    it('should accept a plain object literal as the response body', async () => {
      const {app, router} = createJsonApp();

      registerUpdatePet({
        router,
        callback: () => ({
          status: 200,
          body: {name: 'plain', photoUrls: ['a']}
        })
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(`${baseUrl}/pet`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(validPet)
        });

        expect(response.status).toBe(200);
        expect(APet.unmarshal(await response.text()).name).toEqual('plain');
      });
    });
  });

  describe('bodyless declared status codes', () => {
    it('should send no body for a declared-but-bodyless status code', async () => {
      const {app, router} = createJsonApp();

      registerAddPet({
        router,
        callback: () => ({status: 405})
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(`${baseUrl}/pet`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(validPet)
        });

        expect(response.status).toBe(405);
        expect(await response.text()).toEqual('');
      });
    });
  });

  describe('parameters and headers', () => {
    it('should give the handler typed path, query and header values', async () => {
      const {app, router} = createJsonApp();
      let receivedParameters: FindPetsByStatusAndCategoryParameters | undefined;
      let receivedHeaders: FindPetsByStatusAndCategoryHeaders | undefined;

      registerFindPetsByStatusAndCategory({
        router,
        callback: ({parameters, requestHeaders}) => {
          receivedParameters = parameters;
          receivedHeaders = requestHeaders;
          return {status: 200, body: [new APet(validPet)]};
        }
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(
          `${baseUrl}/pet/findByStatus/available/7?limit=5&tags=cute,small&includePetDetails=true`,
          {
            headers: {
              'X-Request-ID': 'req-123',
              'Accept-Language': 'da-DK'
            }
          }
        );

        expect(response.status).toBe(200);
        expect(receivedParameters).toBeInstanceOf(
          FindPetsByStatusAndCategoryParameters
        );
        expect(receivedParameters?.status).toEqual('available');
        expect(receivedParameters?.categoryId).toEqual(7);
        expect(receivedParameters?.limit).toEqual(5);
        expect(receivedParameters?.tags).toEqual(['cute', 'small']);
        expect(receivedParameters?.includePetDetails).toEqual(true);
        expect(receivedHeaders?.xMinusRequestMinusId).toEqual('req-123');
        expect(receivedHeaders?.acceptMinusLanguage).toEqual('da-DK');
      });
    });

    it('should still extract parameters when the router is mounted under a prefix', async () => {
      const {app, router} = createJsonApp();
      let receivedParameters: FindPetsByStatusAndCategoryParameters | undefined;

      registerFindPetsByStatusAndCategory({
        router,
        callback: ({parameters}) => {
          receivedParameters = parameters;
          return {status: 200, body: []};
        }
      });
      // Re-mount the same router behind a prefix. Express makes `request.url`
      // mount-relative, so the generated code must not use `originalUrl`.
      app.use('/v2', router);

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(
          `${baseUrl}/v2/pet/findByStatus/sold/3?limit=2`
        );

        expect(response.status).toBe(200);
        expect(receivedParameters?.status).toEqual('sold');
        expect(receivedParameters?.categoryId).toEqual(3);
        expect(receivedParameters?.limit).toEqual(2);
      });
    });
  });

  describe('error handling', () => {
    it('should map a thrown HttpError onto its status and body', async () => {
      const {app, router} = createJsonApp();

      registerAddPet({
        router,
        callback: () => {
          throw new HttpError('nope', 404, 'Not Found', {reason: 'gone'});
        }
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(`${baseUrl}/pet`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(validPet)
        });

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({reason: 'gone'});
      });
    });

    it('should map a plain Error onto 500 without leaking its message', async () => {
      const {app, router} = createJsonApp();

      registerAddPet({
        router,
        callback: () => {
          throw new Error('database password is hunter2');
        }
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(`${baseUrl}/pet`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(validPet)
        });

        expect(response.status).toBe(500);
        expect(await response.text()).not.toContain('hunter2');
      });
    });
  });

  describe('hooks', () => {
    it('should call beforeHandler and afterHandler', async () => {
      const {app, router} = createJsonApp();
      const calls: string[] = [];
      let afterStatus: number | undefined;

      registerAddPet({
        router,
        hooks: {
          beforeHandler: () => {
            calls.push('before');
          },
          afterHandler: ({status}) => {
            calls.push('after');
            afterStatus = status;
          }
        },
        callback: ({body}) => {
          calls.push('handler');
          return {status: 200, body};
        }
      });

      return runWithServer(app, async ({baseUrl}) => {
        await fetch(`${baseUrl}/pet`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(validPet)
        });

        expect(calls).toEqual(['before', 'handler', 'after']);
        expect(afterStatus).toEqual(200);
      });
    });

    it('should let onError override the mapped error response', async () => {
      const {app, router} = createJsonApp();

      registerAddPet({
        router,
        hooks: {
          onError: () => ({status: 418, body: {teapot: true}})
        },
        callback: () => {
          throw new Error('boom');
        }
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(`${baseUrl}/pet`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(validPet)
        });

        expect(response.status).toBe(418);
        expect(await response.json()).toEqual({teapot: true});
      });
    });
  });

  describe('headers on the response', () => {
    it('should send additionalHeaders and let a per-response header win', async () => {
      const {app, router} = createJsonApp();

      registerAddPet({
        router,
        additionalHeaders: {'X-Server': 'codegen', 'X-Shared': 'base'},
        callback: ({body}) => ({
          status: 200,
          body,
          headers: {'X-Shared': 'override'}
        })
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(`${baseUrl}/pet`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(validPet)
        });

        expect(response.headers.get('x-server')).toEqual('codegen');
        expect(response.headers.get('x-shared')).toEqual('override');
      });
    });
  });

  describe('request validation', () => {
    it('should reject an invalid request body with 400 and the validation causes', async () => {
      const {app, router} = createJsonApp();
      let handlerCalled = false;

      registerAddPet({
        router,
        callback: ({body}) => {
          handlerCalled = true;
          return {status: 200, body};
        }
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(`${baseUrl}/pet`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({id: 1})
        });

        expect(response.status).toBe(400);
        expect(await response.text()).toContain('cause');
        expect(handlerCalled).toEqual(false);
      });
    });

    it('should let an invalid body through when skipRequestValidation is set', async () => {
      const {app, router} = createJsonApp();
      let handlerCalled = false;

      registerAddPet({
        router,
        skipRequestValidation: true,
        callback: ({body}) => {
          handlerCalled = true;
          return {status: 200, body};
        }
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await fetch(`${baseUrl}/pet`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({id: 1})
        });

        expect(response.status).toBe(200);
        expect(handlerCalled).toEqual(true);
      });
    });
  });

  describe('generated client against generated server', () => {
    it('should round trip a POST through the generated HTTP client', async () => {
      const {app, router} = createJsonApp();

      registerAddPet({
        router,
        callback: ({body}) => ({status: 200, body})
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await addPetClient({
          baseUrl,
          payload: new APet(validPet)
        });

        expect(response.status).toBe(200);
        expect(response.data.name).toEqual('doggie');
        expect(response.data.id).toEqual(42);
      });
    });

    it('should round trip a GET with parameters and headers through the generated HTTP client', async () => {
      const {app, router} = createJsonApp();
      let receivedParameters: FindPetsByStatusAndCategoryParameters | undefined;
      let receivedHeaders: FindPetsByStatusAndCategoryHeaders | undefined;

      registerFindPetsByStatusAndCategory({
        router,
        callback: ({parameters, requestHeaders}) => {
          receivedParameters = parameters;
          receivedHeaders = requestHeaders;
          return {status: 200, body: [new APet(validPet)]};
        }
      });

      return runWithServer(app, async ({baseUrl}) => {
        const response = await findPetsByStatusAndCategoryClient({
          baseUrl,
          parameters: new FindPetsByStatusAndCategoryParameters({
            status: 'available',
            categoryId: 9,
            limit: 3,
            tags: ['a', 'b']
          }),
          requestHeaders: {
            xMinusRequestMinusId: 'round-trip',
            acceptMinusLanguage: 'en-GB'
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveLength(1);
        expect(response.data[0].name).toEqual('doggie');
        expect(receivedParameters?.categoryId).toEqual(9);
        expect(receivedParameters?.limit).toEqual(3);
        expect(receivedParameters?.tags).toEqual(['a', 'b']);
        expect(receivedHeaders?.xMinusRequestMinusId).toEqual('round-trip');
        expect(receivedHeaders?.acceptMinusLanguage).toEqual('en-GB');
      });
    });
  });
});
