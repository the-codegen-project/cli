/* eslint-disable no-undef, security/detect-object-injection */
import http from 'http';
import {AddressInfo} from 'net';
import fs from 'fs';
import path from 'path';

export interface RecordedRequest {
  url: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface TestRoute {
  path: string;
  status?: number;
  body: string;
  contentType?: string;
  /** if set, request must include this header (case-insensitive name); else server returns 401 */
  requireHeader?: {name: string; value: string};
}

export interface TestServer {
  url: string;
  port: number;
  requests: RecordedRequest[];
  close: () => Promise<void>;
}

/**
 * Starts a real http server bound to 127.0.0.1 on a random port.
 * Routes are matched by URL pathname. Unknown paths return 404.
 */
export async function startTestServer(routes: TestRoute[]): Promise<TestServer> {
  const requests: RecordedRequest[] = [];

  const server = http.createServer((req, res) => {
    const recorded: RecordedRequest = {
      url: req.url ?? '',
      method: req.method ?? 'GET',
      headers: {...req.headers}
    };
    requests.push(recorded);

    const route = routes.find((r) => r.path === (req.url ?? '').split('?')[0]);
    if (!route) {
      res.writeHead(404, {'content-type': 'text/plain'});
      res.end(`Not found: ${req.url}`);
      return;
    }

    if (route.requireHeader) {
      const lower = route.requireHeader.name.toLowerCase();
      const got = req.headers[lower];
      if (got !== route.requireHeader.value) {
        res.writeHead(401, {'content-type': 'text/plain'});
        res.end('Unauthorized');
        return;
      }
    }

    const headers: Record<string, string> = {};
    if (route.contentType) {
      headers['content-type'] = route.contentType;
    }
    res.writeHead(route.status ?? 200, headers);
    res.end(route.body);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as AddressInfo;
  const port = address.port;
  const url = `http://127.0.0.1:${port}`;

  return {
    url,
    port,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      })
  };
}

/**
 * Reads a fixture file from test/configs/remote-url/.
 */
export function readFixture(name: string): string {
  return fs.readFileSync(
    path.resolve(__dirname, '../../../configs/remote-url', name),
    'utf-8'
  );
}
