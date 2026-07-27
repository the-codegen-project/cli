import {
  defaultTypeScriptChannelsGenerator,
  generateTypeScriptChannels
} from '../../../../../../../src/codegen/generators';
import {loadAsyncapiFromMemory} from '../../../../../../../src/codegen/inputs/asyncapi';
import {
  ConstrainedAnyModel,
  OutputModel
} from '@asyncapi/modelina';

const payloadModel = new OutputModel(
  '',
  new ConstrainedAnyModel('TestPayloadModel', undefined, {}, 'Payload'),
  'TestPayloadModel',
  {models: {}, originalInput: undefined},
  []
);

const dependencyOutputs = {
  'parameters-typescript': {
    channelModels: {},
    generator: {outputPath: './test'} as any,
    files: []
  },
  'payloads-typescript': {
    channelModels: {
      ping: {messageModel: payloadModel, messageType: 'MessageType'}
    },
    operationModels: {
      pingRequest: {messageModel: payloadModel, messageType: 'MessageType'},
      pongResponse: {messageModel: payloadModel, messageType: 'MessageType'},
      pingRequest_reply: {messageModel: payloadModel, messageType: 'MessageType'}
    },
    otherModels: [],
    generator: {outputPath: './test'} as any,
    files: []
  },
  'headers-typescript': {
    channelModels: {},
    generator: {outputPath: './test'} as any,
    files: []
  }
};

const docWithServers = (serversYaml: string): string => `asyncapi: 3.0.0
info:
  title: Ping
  version: 1.0.0
${serversYaml}channels:
  ping:
    address: /ping
    messages:
      ping:
        $ref: '#/components/messages/ping'
      pong:
        $ref: '#/components/messages/pong'
operations:
  pingRequest:
    action: send
    channel:
      $ref: '#/channels/ping'
    messages:
      - $ref: '#/channels/ping/messages/ping'
    reply:
      channel:
        $ref: '#/channels/ping'
      messages:
        - $ref: '#/channels/ping/messages/pong'
    bindings:
      http:
        method: GET
components:
  messages:
    ping:
      payload:
        type: object
        properties:
          event:
            type: string
    pong:
      payload:
        type: object
        properties:
          event:
            type: string
`;

async function generateHttp(serversYaml: string): Promise<string> {
  const document = await loadAsyncapiFromMemory(docWithServers(serversYaml));
  const generated = await generateTypeScriptChannels({
    generator: {
      ...defaultTypeScriptChannelsGenerator,
      outputPath: './output',
      id: 'test-http-servers',
      asyncapiGenerateForOperations: true,
      protocols: ['http_client']
    },
    inputType: 'asyncapi',
    asyncapiDocument: document,
    dependencyOutputs
  } as any);
  return generated.files.map((file) => file.content).join('\n');
}

describe('HTTP client baseURL from document servers', () => {
  it('defaults baseUrl to the document HTTP(S) server URL', async () => {
    const code = await generateHttp(
      `servers:
  production:
    host: api.example.com
    protocol: https
`
    );
    expect(code).toContain('https://api.example.com');
    expect(code).not.toContain('http://localhost:3000');
  });

  it('falls back to http://localhost:3000 when the document has no servers', async () => {
    const code = await generateHttp('');
    expect(code).toContain('http://localhost:3000');
  });

  it('does not offer non-HTTP servers to the HTTP client', async () => {
    const code = await generateHttp(
      `servers:
  production:
    host: api.example.com
    protocol: https
  events:
    host: broker.example.com
    protocol: nats
`
    );
    expect(code).toContain('https://api.example.com');
    expect(code).not.toContain('broker.example.com');
  });
});
