import path from 'path';
import {loadOpenapi} from '../../../src/codegen/inputs/openapi';
import {RunGeneratorContext} from '../../../src/codegen/types';
import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import {startTestServer} from './__helpers__/httpServer';

describe('OpenAPI Input Parser', () => {
  it('should load and parse OpenAPI 3.0 document', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'openapi',
        inputPath: 'openapi-3.json',
        generators: []
      },
      configFilePath: path.resolve(__dirname, '../../configs/config.json'),
      documentPath: path.resolve(__dirname, '../../configs/openapi-3.json'),
    };

    const document = await loadOpenapi(context) as OpenAPIV3.Document;
    
    expect(document).toBeDefined();
    expect(document.openapi).toBeDefined();
    expect(document.info).toBeDefined();
    expect(document.info.title).toBe('OpenAPI Petstore');
    expect(document.info.version).toBe('1.0.0');
    expect(document.paths).toBeDefined();
    expect(Object.keys(document.paths).length).toBeGreaterThan(0);
  });
  it('should load and parse OpenAPI 3.1 document', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'openapi',
        inputPath: 'openapi-3_1.json',
        generators: []
      },
      configFilePath: path.resolve(__dirname, '../../configs/config.json'),
      documentPath: path.resolve(__dirname, '../../configs/openapi-3_1.json'),
    };

    const document = await loadOpenapi(context) as OpenAPIV3_1.Document;
    
    expect(document).toBeDefined();
    expect(document.openapi).toBeDefined();
    expect(document.info).toBeDefined();
    expect(document.info.title).toBe('OpenAPI Petstore');
    expect(document.info.version).toBe('1.0.0');
    expect(document.paths).toBeDefined();
    expect(Object.keys(document.paths ?? {}).length).toBeGreaterThan(0);
  });
  it('should load and parse OpenAPI 2.0 document', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'openapi',
        inputPath: 'openapi-2.json',
        generators: []
      },
      configFilePath: path.resolve(__dirname, '../../configs/config.json'),
      documentPath: path.resolve(__dirname, '../../configs/openapi-2.json'),
    };

    const document = await loadOpenapi(context) as OpenAPIV2.Document;
    
    expect(document).toBeDefined();
    expect(document.swagger).toBeDefined();
    expect(document.info).toBeDefined();
    expect(document.info.title).toBe('Swagger Petstore');
    expect(document.info.version).toBe('1.0.7');
    expect(document.paths).toBeDefined();
    expect(Object.keys(document.paths).length).toBeGreaterThan(0);
  });

  it('should handle invalid OpenAPI document', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'openapi',
        inputPath: 'invalid.yaml',
        generators: []
      },
      configFilePath: path.resolve(__dirname, '../../configs/config.json'),
      documentPath: path.resolve(__dirname, 'non-existent-file.yaml'),
    };

    await expect(loadOpenapi(context)).rejects.toThrow();
  });

  describe('remote URL loading', () => {
    it('loads an OpenAPI document from a URL', async () => {
      const yaml = `openapi: 3.0.0
info:
  title: Remote
  version: 1.0.0
paths: {}
`;
      const server = await startTestServer([
        {
          path: '/openapi.yaml',
          body: yaml,
          contentType: 'application/yaml'
        }
      ]);
      try {
        const context: RunGeneratorContext = {
          configuration: {
            inputType: 'openapi',
            inputPath: `${server.url}/openapi.yaml`,
            generators: []
          },
          configFilePath: 'codegen.json',
          documentPath: `${server.url}/openapi.yaml`
        };
        const document = await loadOpenapi(context) as OpenAPIV3.Document;
        expect(document.info.title).toBe('Remote');
      } finally {
        await server.close();
      }
    });

    it('sends bearer auth headers', async () => {
      const yaml = `openapi: 3.0.0
info:
  title: Auth
  version: 1.0.0
paths: {}
`;
      const server = await startTestServer([
        {
          path: '/openapi.yaml',
          body: yaml,
          contentType: 'application/yaml',
          requireHeader: {name: 'authorization', value: 'Bearer abc'}
        }
      ]);
      try {
        const context: RunGeneratorContext = {
          configuration: {
            inputType: 'openapi',
            inputPath: `${server.url}/openapi.yaml`,
            generators: []
          },
          configFilePath: 'codegen.json',
          documentPath: `${server.url}/openapi.yaml`,
          inputAuth: {type: 'bearer', token: 'abc'}
        };
        await expect(loadOpenapi(context)).resolves.toBeDefined();
        expect(server.requests[0]!.headers['authorization']).toBe('Bearer abc');
      } finally {
        await server.close();
      }
    });

    it('parses JSON content based on Content-Type', async () => {
      const json = JSON.stringify({
        openapi: '3.0.0',
        info: {title: 'JSON Remote', version: '1.0.0'},
        paths: {}
      });
      const server = await startTestServer([
        {
          path: '/openapi',
          body: json,
          contentType: 'application/json'
        }
      ]);
      try {
        const context: RunGeneratorContext = {
          configuration: {
            inputType: 'openapi',
            inputPath: `${server.url}/openapi`,
            generators: []
          },
          configFilePath: 'codegen.json',
          documentPath: `${server.url}/openapi`
        };
        const document = await loadOpenapi(context) as OpenAPIV3.Document;
        expect(document.info.title).toBe('JSON Remote');
      } finally {
        await server.close();
      }
    });

    it('uses URL extension fallback for ambiguous Content-Type', async () => {
      const yaml = `openapi: 3.0.0
info:
  title: Yaml fallback
  version: 1.0.0
paths: {}
`;
      const server = await startTestServer([
        {
          path: '/spec.yaml',
          body: yaml,
          contentType: 'application/octet-stream'
        }
      ]);
      try {
        const context: RunGeneratorContext = {
          configuration: {
            inputType: 'openapi',
            inputPath: `${server.url}/spec.yaml`,
            generators: []
          },
          configFilePath: 'codegen.json',
          documentPath: `${server.url}/spec.yaml`
        };
        const document = await loadOpenapi(context) as OpenAPIV3.Document;
        expect(document.info.title).toBe('Yaml fallback');
      } finally {
        await server.close();
      }
    });

    it('propagates 404 errors', async () => {
      const server = await startTestServer([]);
      try {
        const context: RunGeneratorContext = {
          configuration: {
            inputType: 'openapi',
            inputPath: `${server.url}/missing.yaml`,
            generators: []
          },
          configFilePath: 'codegen.json',
          documentPath: `${server.url}/missing.yaml`
        };
        await expect(loadOpenapi(context)).rejects.toThrow();
      } finally {
        await server.close();
      }
    });
  });
});
