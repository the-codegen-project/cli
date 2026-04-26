import {loadAsyncapi} from '../../../src/codegen/inputs/asyncapi';
import {RunGeneratorContext} from '../../../src/codegen/types';
import {startTestServer, readFixture} from './__helpers__/httpServer';

describe('AsyncAPI loader URL support', () => {
  it('loads an asyncapi document from a remote URL', async () => {
    const fixture = readFixture('asyncapi.yaml');
    const server = await startTestServer([
      {path: '/asyncapi.yaml', body: fixture, contentType: 'application/yaml'}
    ]);
    try {
      const context: RunGeneratorContext = {
        configuration: {
          inputType: 'asyncapi',
          inputPath: `${server.url}/asyncapi.yaml`,
          generators: []
        },
        configFilePath: 'codegen.json',
        documentPath: `${server.url}/asyncapi.yaml`
      };
      const document = await loadAsyncapi(context);
      expect(document).toBeDefined();
      expect(document?.info().title()).toBe('Remote URL Test');
    } finally {
      await server.close();
    }
  });

  it('sends the bearer auth header when configured', async () => {
    const fixture = readFixture('asyncapi.yaml');
    const server = await startTestServer([
      {
        path: '/asyncapi.yaml',
        body: fixture,
        contentType: 'application/yaml',
        requireHeader: {name: 'authorization', value: 'Bearer abc'}
      }
    ]);
    try {
      const context: RunGeneratorContext = {
        configuration: {
          inputType: 'asyncapi',
          inputPath: `${server.url}/asyncapi.yaml`,
          generators: []
        },
        configFilePath: 'codegen.json',
        documentPath: `${server.url}/asyncapi.yaml`,
        inputAuth: {type: 'bearer', token: 'abc'}
      };
      await expect(loadAsyncapi(context)).resolves.toBeDefined();
      expect(server.requests).toHaveLength(1);
      const req = server.requests[0]!;
      expect(req.headers['authorization']).toBe('Bearer abc');
    } finally {
      await server.close();
    }
  });

  it('throws when remote returns 401', async () => {
    const server = await startTestServer([
      {
        path: '/asyncapi.yaml',
        body: 'unauth',
        requireHeader: {name: 'authorization', value: 'Bearer expected'}
      }
    ]);
    try {
      const context: RunGeneratorContext = {
        configuration: {
          inputType: 'asyncapi',
          inputPath: `${server.url}/asyncapi.yaml`,
          generators: []
        },
        configFilePath: 'codegen.json',
        documentPath: `${server.url}/asyncapi.yaml`
      };
      await expect(loadAsyncapi(context)).rejects.toThrow();
    } finally {
      await server.close();
    }
  });
});
