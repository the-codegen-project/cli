/**
 * Per-operation rendering for the `http_server` protocol — the mirror of
 * `renderHttpFetchClient`.
 */
import {
  ConstrainedObjectModel,
  ConstrainedObjectPropertyModel,
  ConstrainedStringModel
} from '@asyncapi/modelina';
import {renderHttpServerRegister} from '../../../../../../../src/codegen/generators/typescript/channels/protocols/http/server';
import {
  ChannelFunctionTypes,
  HttpServerResponseVariant,
  RenderHttpServerParameters
} from '../../../../../../../src/codegen/generators/typescript/channels/types';
import {TypeScriptPayloadRenderType} from '../../../../../../../src/codegen/generators/typescript/payloads';

function objectModel(name: string, propertyNames: string[]) {
  const properties: Record<string, ConstrainedObjectPropertyModel> = {};
  for (const propertyName of propertyNames) {
    properties[propertyName] = new ConstrainedObjectPropertyModel(
      propertyName,
      propertyName,
      true,
      new ConstrainedStringModel(propertyName, undefined, {}, 'string')
    );
  }
  return new ConstrainedObjectModel(
    name,
    undefined,
    {},
    name,
    properties as any
  );
}

const payloadGenerator = (includeValidation: boolean) =>
  ({
    generator: {includeValidation}
  }) as unknown as TypeScriptPayloadRenderType;

const petVariants: HttpServerResponseVariant[] = [
  {
    statusCode: 200,
    bodyType: 'APet',
    bodyInputType: 'APetInterface | APet',
    isObjectModel: true
  },
  {statusCode: 405}
];

function render(
  overrides: Partial<RenderHttpServerParameters> = {}
): ReturnType<typeof renderHttpServerRegister> {
  return renderHttpServerRegister({
    requestTopic: '/pet',
    method: 'POST',
    requestMessageType: 'APet',
    requestMessageModule: undefined,
    channelParameters: undefined,
    channelHeaders: undefined,
    functionName: 'registerAddPet',
    payloadGenerator: payloadGenerator(false),
    responses: petVariants,
    ...overrides
  });
}

describe('renderHttpServerRegister', () => {
  describe('the register contract', () => {
    it('takes a single context object and returns void', () => {
      const {code, functionName, functionType} = render();

      expect(functionName).toEqual('registerAddPet');
      expect(functionType).toEqual(ChannelFunctionTypes.HTTP_SERVER);
      expect(code).toContain(
        'export interface RegisterAddPetContext extends HttpServerContext'
      );
      expect(code).toContain('  router: Router;');
      expect(code).toContain(
        'function registerAddPet(context: RegisterAddPetContext): void'
      );
    });

    it('defaults the function name from the request topic', () => {
      const {functionName} = render({functionName: undefined});

      expect(functionName).toEqual('registerPet');
    });

    it('declares the Express import as a dependency', () => {
      const {dependencies} = render();

      expect(
        dependencies.some((line: string) => line.includes("from 'express'"))
      ).toBe(true);
    });

    it('passes the handler a single destructured params object', () => {
      const {code} = render();

      expect(code).toContain('callback: (params: {');
      // The typed return value owns the response — handing over `response` or
      // `next` would make the contract ambiguous.
      expect(code).not.toContain('response: Response;\n  }');
      expect(code).toContain('request: Request;');
    });
  });

  describe('route registration', () => {
    it('converts a path template into an Express route', () => {
      const {code} = render({
        requestTopic: '/pet/findByStatus/{status}/{categoryId}',
        method: 'GET',
        requestMessageType: undefined,
        channelParameters: objectModel('FindPetsByStatusAndCategoryParameters', [
          'status',
          'categoryId'
        ])
      });

      expect(code).toContain(
        "router.get('/pet/findByStatus/:status/:categoryId'"
      );
    });

    it('adds a leading slash when the template lacks one', () => {
      const {code} = render({requestTopic: 'pet', method: 'POST'});

      expect(code).toContain("router.post('/pet'");
    });
  });

  describe('parameters', () => {
    it('extracts parameters from the mount-relative url with the path template', () => {
      const {code, parameterType} = render({
        requestTopic: '/pet/findByStatus/{status}/{categoryId}',
        method: 'GET',
        requestMessageType: undefined,
        channelParameters: objectModel('FindPetsByStatusAndCategoryParameters', [
          'status'
        ])
      });

      expect(code).toContain(
        "FindPetsByStatusAndCategoryParameters.fromUrl(request.url, '/pet/findByStatus/{status}/{categoryId}')"
      );
      // Express strips the mount prefix from `url` but not from `originalUrl`,
      // and `extractPathParameters` anchors its regex against the whole path.
      expect(code).not.toContain('originalUrl');
      expect(code).toContain('parameters,');
      expect(parameterType).toEqual('FindPetsByStatusAndCategoryParameters');
    });

    it('emits no parameter extraction when the operation has none', () => {
      const {code} = render();

      expect(code).not.toContain('fromUrl');
      expect(code).not.toContain('parameters:');
    });
  });

  describe('headers', () => {
    it('deserializes request headers when the model exposes a deserializer', () => {
      const {code, headerType} = render({
        channelHeaders: objectModel('AddPetHeaders', ['xRequestId']),
        hasDeserializeHeaders: true
      });

      expect(code).toContain(
        'deserializeAddPetHeadersHeaders(request.headers'
      );
      expect(code).toContain('requestHeaders: AddPetHeaders;');
      expect(headerType).toEqual('AddPetHeaders');
    });

    it('emits no header handling when there is no deserializer', () => {
      const {code} = render({
        channelHeaders: objectModel('AddPetHeaders', ['xRequestId']),
        hasDeserializeHeaders: false
      });

      expect(code).not.toContain('deserializeAddPetHeadersHeaders');
      expect(code).not.toContain('requestHeaders');
    });
  });

  describe('request body', () => {
    it('unmarshals the body for body-carrying methods', () => {
      const {code} = render({method: 'PUT'});

      expect(code).toContain('readJsonBody(request)');
      // The JSON text is passed, not the parsed object: a primitive payload's
      // `unmarshal` JSON-parses its argument.
      expect(code).toContain('APet.unmarshal(JSON.stringify(');
      expect(code).toContain('body: APet;');
    });

    it('emits no body handling for GET and DELETE', () => {
      for (const method of ['GET', 'DELETE'] as const) {
        const {code} = render({method, requestMessageType: undefined});

        expect(code).not.toContain('readJsonBody');
        expect(code).not.toContain('body: APet;');
      }
    });
  });

  describe('validation', () => {
    it('creates the validator once outside the route handler', () => {
      const {code} = render({payloadGenerator: payloadGenerator(true)});

      expect(code).toContain('APet.createValidator()');
      expect(code).toContain('skipRequestValidation');
      // Compiling an Ajv validator per request would be a real performance bug.
      const validatorIndex = code.indexOf('createValidator()');
      const routeIndex = code.indexOf('router.post(');
      expect(validatorIndex).toBeGreaterThan(-1);
      expect(validatorIndex).toBeLessThan(routeIndex);
    });

    it('emits no validation code when includeValidation is off', () => {
      const {code} = render({payloadGenerator: payloadGenerator(false)});

      expect(code).not.toContain('createValidator');
      expect(code).not.toContain('skipRequestValidation');
    });
  });

  describe('the response union', () => {
    it('renders one member per declared variant', () => {
      const {code, replyType} = render();

      expect(replyType).toEqual('AddPetServerResponse');
      expect(code).toContain('export type AddPetServerResponse =');
      expect(code).toContain(
        '| {status: 200; body: APetInterface | APet; headers?: Record<string, string | string[]>}'
      );
      expect(code).toContain(
        '| {status: 405; headers?: Record<string, string | string[]>}'
      );
    });

    it('falls back to an untyped response when no variants were collected', () => {
      const {code} = render({responses: []});

      expect(code).toContain(
        'export type AddPetServerResponse = {status: number; body?: unknown; headers?: Record<string, string | string[]>};'
      );
    });

    it('marshals a module-qualified body through its module', () => {
      const {code} = render({
        method: 'GET',
        requestMessageType: undefined,
        responses: [
          {
            statusCode: 200,
            bodyType: 'ListModule.List',
            bodyInputType: 'ListModule.List',
            bodyModule: 'ListModule',
            isObjectModel: false
          }
        ]
      });

      expect(code).toContain('ListModule.marshal(');
    });

    it('falls back to JSON.stringify for a non-object union member', () => {
      const {code} = render({
        method: 'GET',
        requestMessageType: undefined,
        responses: [
          {
            statusCode: 200,
            bodyType: 'APet[]',
            bodyInputType: 'APet[]',
            isObjectModel: false
          }
        ]
      });

      expect(code).toContain('JSON.stringify(');
    });

    it('renders the default response as an open status member placed last', () => {
      const {code} = render({
        responses: [
          {statusCode: 200, bodyType: 'APet', bodyInputType: 'APet', isObjectModel: true},
          {statusCode: 'default'}
        ]
      });

      const union = code.slice(0, code.indexOf('export interface'));
      expect(union).toContain(
        '| {status: number; headers?: Record<string, string | string[]>}'
      );
      expect(union.indexOf('status: 200')).toBeLessThan(
        union.indexOf('status: number')
      );
      // The open `{status: number}` member cannot be narrowed away by a literal
      // `case`, so the concrete cases reach their body through a cast.
      expect(code).toContain('(result as {body: APet}).body');
    });

    it('emits a default clause carrying the default response body', () => {
      const {code} = render({
        responses: [
          {statusCode: 200, bodyType: 'APet', bodyInputType: 'APet', isObjectModel: true},
          {
            statusCode: 'default',
            bodyType: 'AnError',
            bodyInputType: 'AnErrorInterface | AnError',
            isObjectModel: true
          }
        ]
      });

      expect(code).toContain('default: {');
      expect(code).toContain('new AnError(responsePayload)');
    });
  });

  describe('JSDoc', () => {
    it('propagates the operation description and deprecation', () => {
      const {code} = render({
        description: 'Add a new pet to the store',
        deprecated: true
      });

      expect(code).toContain('Add a new pet to the store');
      expect(code).toContain('@deprecated');
    });
  });

  it('matches the snapshot for the representative operation shapes', () => {
    expect(render({description: 'Add a new pet to the store'}).code).toMatchSnapshot(
      'body-and-responses'
    );
    expect(
      render({
        requestTopic: '/pet/findByStatus/{status}/{categoryId}',
        method: 'GET',
        functionName: 'registerFindPetsByStatusAndCategory',
        requestMessageType: undefined,
        channelParameters: objectModel(
          'FindPetsByStatusAndCategoryParameters',
          ['status']
        ),
        channelHeaders: objectModel('FindPetsByStatusAndCategoryHeaders', [
          'xRequestId'
        ]),
        hasDeserializeHeaders: true,
        payloadGenerator: payloadGenerator(true),
        responses: [
          {
            statusCode: 200,
            bodyType: 'ListModule.List',
            bodyInputType: 'ListModule.List',
            bodyModule: 'ListModule',
            isObjectModel: false
          },
          {statusCode: 400},
          {statusCode: 404}
        ]
      }).code
    ).toMatchSnapshot('parameters-and-headers');
    expect(
      render({
        requestTopic: '/health',
        method: 'GET',
        functionName: 'registerHealth',
        requestMessageType: undefined,
        responses: [{statusCode: 204}]
      }).code
    ).toMatchSnapshot('bare');
  });
});
