/**
 * End-to-end checks for the OpenAPI -> HTTP client response handling, driven
 * through the in-memory generation pipeline so the assertions run against the
 * file contents a user actually receives.
 *
 * Each case here corresponds to a way the generated client used to fail on an
 * entirely ordinary document: a schema named `Error`, an array-typed success
 * response, and responses with no body at all.
 */
import {generate, BrowserGenerateInput} from '../../../../../src/browser/generate';

/**
 * A list endpoint returning an array alongside a declared error code, a create
 * endpoint, a delete endpoint whose success is `204`, and - deliberately - a
 * component schema called `Error`, which is the conventional name for one.
 */
const bookstoreSpec = JSON.stringify({
  openapi: '3.0.3',
  info: {title: 'Bookstore API', version: '1.0.0'},
  servers: [{url: 'https://api.bookstore.example/v1'}],
  components: {
    schemas: {
      Book: {
        type: 'object',
        required: ['id', 'title'],
        properties: {id: {type: 'string'}, title: {type: 'string'}}
      },
      Error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {code: {type: 'string'}, message: {type: 'string'}}
      }
    }
  },
  paths: {
    '/books': {
      get: {
        operationId: 'listBooks',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {$ref: '#/components/schemas/Book'}
                }
              }
            }
          },
          400: {
            description: 'Bad request',
            content: {
              'application/json': {schema: {$ref: '#/components/schemas/Error'}}
            }
          }
        }
      }
    },
    '/books/{bookId}': {
      parameters: [
        {name: 'bookId', in: 'path', required: true, schema: {type: 'string'}}
      ],
      delete: {
        operationId: 'deleteBook',
        responses: {204: {description: 'No content'}}
      }
    }
  }
});

async function generateHttpClient(spec: string): Promise<string> {
  const input: BrowserGenerateInput = {
    spec,
    specFormat: 'openapi',
    config: {
      inputType: 'openapi',
      inputPath: '',
      language: 'typescript',
      generators: [
        {
          preset: 'channels',
          outputPath: 'src/channels',
          protocols: ['http_client']
        }
      ]
    }
  };

  const output = await generate(input);
  expect(output.errors).toHaveLength(0);

  const httpClientPath = Object.keys(output.files).find((file) =>
    file.endsWith('http_client.ts')
  );
  expect(httpClientPath).toBeDefined();
  // eslint-disable-next-line security/detect-object-injection
  return output.files[httpClientPath as string];
}

describe('OpenAPI HTTP client response handling', () => {
  it('does not depend on the ambient Error binding, so a schema named Error cannot shadow it', async () => {
    const code = await generateHttpClient(bookstoreSpec);

    // The payload model named `Error` is imported into this very file, which
    // shadows the global for the whole module - so nothing may reference `Error`
    // by its bare name.
    expect(code).toContain('const HttpGlobalError = globalThis.Error;');
    expect(code).toContain('export class HttpError extends HttpGlobalError');
    expect(code).not.toMatch(/extends Error\b/);
    expect(code).not.toMatch(/new Error\(/);
    expect(code).not.toMatch(/instanceof Error\b/);
  });

  it('emits a status code branch for an array-typed success response', async () => {
    const code = await generateHttpClient(bookstoreSpec);
    expect(code).toContain('unmarshalByStatusCode');
    expect(code).toContain('listBooks');

    // The branch itself lives on the response union model. It used to be
    // omitted for non-object members, so a plain `200` threw "No matching type
    // found for status code" on the success path.
    const input: BrowserGenerateInput = {
      spec: bookstoreSpec,
      specFormat: 'openapi',
      config: {
        inputType: 'openapi',
        inputPath: '',
        language: 'typescript',
        generators: [{preset: 'payloads', outputPath: 'src/payloads'}]
      }
    };
    const output = await generate(input);
    expect(output.errors).toHaveLength(0);

    const unionPath = Object.keys(output.files).find((file) =>
      file.endsWith('ListBooksResponse.ts')
    );
    expect(unionPath).toBeDefined();
    // eslint-disable-next-line security/detect-object-injection
    const unionCode = output.files[unionPath as string];

    expect(unionCode).toContain('if (statusCode === 200)');
    expect(unionCode).toContain('if (statusCode === 400)');
    // An array has no `unmarshal` of its own, so it is parsed structurally.
    expect(unionCode).toMatch(/statusCode === 200\)\s*\{\s*return JSON\.parse\(json\) as/);
  });

  it('generates a function for an operation whose only response has no body', async () => {
    const code = await generateHttpClient(bookstoreSpec);

    // A `DELETE` answering `204 No Content` is ordinary; the operation used to
    // be dropped entirely, leaving no function to call.
    expect(code).toContain('async function deleteBook');
    expect(code).toContain('HttpClientResponse<undefined>');

    // ...and its body must not be parsed, because `.json()` on an empty body
    // throws and would make the successful delete look like a failure.
    expect(code).toContain('readOptionalJsonBody');
    expect(code).toContain('[204, 205, 304].includes(response.status)');
  });

  it('substitutes a path parameter declared on the path item', async () => {
    const code = await generateHttpClient(bookstoreSpec);

    // `bookId` is declared once on the path item, not on the operation.
    expect(code).toContain("buildUrlWithParameters(config.baseUrl, '/books/{bookId}'");
    expect(code).toContain('DeleteBookParameters');
  });

  it('reads the base URL from a Swagger 2.0 host, basePath and schemes', async () => {
    const swagger2Spec = JSON.stringify({
      swagger: '2.0',
      info: {title: 'Legacy API', version: '1.0.0'},
      host: 'api.legacy.example',
      basePath: '/v1',
      schemes: ['https'],
      paths: {
        '/things': {
          get: {
            operationId: 'listThings',
            responses: {
              200: {
                description: 'OK',
                schema: {type: 'object', properties: {id: {type: 'string'}}}
              }
            }
          }
        }
      }
    });

    const code = await generateHttpClient(swagger2Spec);

    // 2.0 has no `servers`, and falling through to localhost silently pointed
    // every generated call at the wrong host.
    expect(code).toContain("baseUrl: 'https://api.legacy.example/v1'");
    expect(code).not.toContain('http://localhost:3000');
  });
});
