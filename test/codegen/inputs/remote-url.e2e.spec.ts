import http from 'http';
import {AddressInfo} from 'net';
import {loadOpenapi} from '../../../src/codegen/inputs/openapi';
import {loadAsyncapi} from '../../../src/codegen/inputs/asyncapi';
import {loadJsonSchema} from '../../../src/codegen/inputs/jsonschema';
import {RunGeneratorContext} from '../../../src/codegen/types';
import {Logger} from '../../../src/LoggingInterface';
import {
  startTestServer,
  readFixture,
  RecordedRequest
} from './__helpers__/httpServer';

const BEARER = 'Bearer secret-token';

function ctx(
  inputType: 'openapi' | 'asyncapi' | 'jsonschema',
  url: string,
  inputAuth?: any
): RunGeneratorContext {
  return {
    configuration: {
      inputType,
      inputPath: url,
      generators: []
    } as any,
    configFilePath: 'codegen.json',
    documentPath: url,
    inputAuth
  };
}

/**
 * Start an HTTP server whose response bodies depend on the actual
 * bound port (so they can include `$ref` URLs back to localhost:<port>).
 * The handler receives `{port, requests}` so it can construct bodies that
 * reference the server itself.
 */
async function startDynamicServer(
  build: (port: number, requests: RecordedRequest[]) => http.RequestListener
): Promise<{
  url: string;
  port: number;
  requests: RecordedRequest[];
  close: () => Promise<void>;
}> {
  const requests: RecordedRequest[] = [];
  const server = http.createServer((req, res) => {
    requests.push({
      url: req.url ?? '',
      method: req.method ?? 'GET',
      headers: {...req.headers}
    });
    // Defer to the user-provided listener that knows the port:
    // We need to bind first to know the port; the placeholder below is
    // replaced once the server is listening (see swap pattern).
    placeholder(req, res);
  });

  let placeholder: http.RequestListener = (_req, res) => {
    res.writeHead(503);
    res.end('not ready');
  };

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  placeholder = build(port, requests);

  return {
    url: `http://127.0.0.1:${port}`,
    port,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      )
  };
}

describe('Remote URL E2E (real HTTP server)', () => {
  describe('Cases 1-3: root URL with auth', () => {
    it('1. Bearer auth on root URL (asyncapi)', async () => {
      const fixture = readFixture('asyncapi.yaml');
      const server = await startTestServer([
        {
          path: '/asyncapi.yaml',
          body: fixture,
          contentType: 'application/yaml',
          requireHeader: {name: 'authorization', value: BEARER}
        }
      ]);
      try {
        await loadAsyncapi(
          ctx('asyncapi', `${server.url}/asyncapi.yaml`, {
            type: 'bearer',
            token: 'secret-token'
          })
        );
        expect(server.requests).toHaveLength(1);
        expect(server.requests[0]!.headers['authorization']).toBe(BEARER);
      } finally {
        await server.close();
      }
    });

    it('2. apiKey auth on root URL (jsonschema)', async () => {
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {id: {type: 'string'}}
      };
      const server = await startTestServer([
        {
          path: '/schema.json',
          body: JSON.stringify(schema),
          contentType: 'application/json',
          requireHeader: {name: 'x-api-key', value: 'k'}
        }
      ]);
      try {
        const result = await loadJsonSchema(
          ctx('jsonschema', `${server.url}/schema.json`, {
            type: 'apiKey',
            header: 'X-API-Key',
            value: 'k'
          })
        );
        expect(result).toEqual(schema);
      } finally {
        await server.close();
      }
    });

    it('3. Custom headers on root URL (openapi)', async () => {
      const yaml = `openapi: 3.0.0
info:
  title: Custom Headers
  version: 1.0.0
paths: {}
`;
      const server = await startTestServer([
        {
          path: '/openapi.yaml',
          body: yaml,
          contentType: 'application/yaml',
          requireHeader: {name: 'x-custom', value: 'value'}
        }
      ]);
      try {
        const document = await loadOpenapi(
          ctx('openapi', `${server.url}/openapi.yaml`, {
            type: 'custom',
            headers: {'X-Custom': 'value'}
          })
        );
        expect(document).toBeDefined();
      } finally {
        await server.close();
      }
    });
  });

  describe('Case 4: cross-spec $ref same host with auth', () => {
    it('OpenAPI cross-spec $ref to same host with auth on both fetches', async () => {
      function authOk(req: http.IncomingMessage): boolean {
        return req.headers['authorization'] === BEARER;
      }

      const server = await startDynamicServer((port) => {
        const root = `openapi: 3.0.0
info:
  title: Same host
  version: 1.0.0
paths:
  /pets:
    get:
      summary: List pets
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: 'http://127.0.0.1:${port}/components.yaml#/components/schemas/Pet'
`;
        const components = `openapi: 3.0.0
info:
  title: Components
  version: 1.0.0
paths: {}
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: string
`;
        return (req, res) => {
          if (!authOk(req)) {
            res.writeHead(401);
            res.end('Unauthorized');
            return;
          }
          if (req.url === '/openapi.yaml') {
            res.writeHead(200, {'content-type': 'application/yaml'});
            res.end(root);
            return;
          }
          if (req.url === '/components.yaml') {
            res.writeHead(200, {'content-type': 'application/yaml'});
            res.end(components);
            return;
          }
          res.writeHead(404);
          res.end('Not found');
        };
      });

      try {
        const document = await loadOpenapi(
          ctx('openapi', `${server.url}/openapi.yaml`, {
            type: 'bearer',
            token: 'secret-token'
          })
        );
        const componentsHits = server.requests.filter(
          (r) => r.url === '/components.yaml'
        );
        expect(componentsHits.length).toBeGreaterThanOrEqual(1);
        expect(componentsHits[0]!.headers['authorization']).toBe(BEARER);
        expect(document).toBeDefined();
      } finally {
        await server.close();
      }
    });
  });

  describe('Case 6: cross-host warning', () => {
    it('emits info-level warning when $ref host differs from root host', async () => {
      const components = `openapi: 3.0.0
info:
  title: Components
  version: 1.0.0
paths: {}
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: string
`;
      const refServer = await startTestServer([
        {
          path: '/components.yaml',
          body: components,
          contentType: 'application/yaml',
          requireHeader: {name: 'authorization', value: BEARER}
        }
      ]);

      const rootServer = await startDynamicServer(() => (req, res) => {
        if (req.headers['authorization'] !== BEARER) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }
        if (req.url === '/openapi.yaml') {
          const yaml = `openapi: 3.0.0
info:
  title: Cross host
  version: 1.0.0
paths:
  /pets:
    get:
      summary: List pets
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '${refServer.url}/components.yaml#/components/schemas/Pet'
`;
          res.writeHead(200, {'content-type': 'application/yaml'});
          res.end(yaml);
          return;
        }
        res.writeHead(404);
        res.end('Not found');
      });

      const infoSpy = jest
        .spyOn(Logger, 'info')
        .mockImplementation(() => undefined);
      try {
        await loadOpenapi(
          ctx('openapi', `${rootServer.url}/openapi.yaml`, {
            type: 'bearer',
            token: 'secret-token'
          })
        );
        const crossHostLogs = infoSpy.mock.calls.filter(([msg]) =>
          String(msg).includes('auth headers sent to')
        );
        expect(crossHostLogs.length).toBeGreaterThanOrEqual(1);
      } finally {
        infoSpy.mockRestore();
        await rootServer.close();
        await refServer.close();
      }
    });
  });

  describe('Case 7: 401 on root', () => {
    it('throws a CodegenError', async () => {
      const server = await startTestServer([
        {
          path: '/openapi.yaml',
          body: '',
          requireHeader: {name: 'authorization', value: 'Bearer match'}
        }
      ]);
      try {
        await expect(
          loadOpenapi(
            ctx('openapi', `${server.url}/openapi.yaml`, {
              type: 'bearer',
              token: 'wrong'
            })
          )
        ).rejects.toThrow();
      } finally {
        await server.close();
      }
    });
  });

  describe('Case 9: no auth on public root URL', () => {
    it('succeeds without an Authorization header', async () => {
      const yaml = `openapi: 3.0.0
info:
  title: Public
  version: 1.0.0
paths: {}
`;
      const server = await startTestServer([
        {path: '/openapi.yaml', body: yaml, contentType: 'application/yaml'}
      ]);
      try {
        await loadOpenapi(ctx('openapi', `${server.url}/openapi.yaml`));
        expect(server.requests[0]!.headers['authorization']).toBeUndefined();
      } finally {
        await server.close();
      }
    });
  });
});
