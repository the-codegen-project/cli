/**
 * Tests that all protocol generators handle undefined functionTypeMapping gracefully.
 *
 * Bug: When generator.functionTypeMapping is undefined (instead of {}), accessing
 * generator.functionTypeMapping[channel.id()] throws:
 * "Cannot read properties of undefined (reading 'channel_id')"
 *
 * This test verifies that all 7 protocol generators have defensive access via optional chaining.
 */
import path from 'node:path';
import {
  defaultTypeScriptChannelsGenerator,
  generateTypeScriptChannels,
  TypeScriptParameterRenderType
} from '../../../../../../src/codegen/generators';
import {loadAsyncapiDocument} from '../../../../../../src/codegen/inputs/asyncapi';
import {
  ConstrainedAnyModel,
  ConstrainedObjectModel,
  OutputModel
} from '@asyncapi/modelina';
import {TypeScriptPayloadRenderType} from '../../../../../../src/codegen/generators/typescript/payloads';
import {TypeScriptHeadersRenderType} from '../../../../../../src/codegen/generators/typescript/headers';

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined)
}));

describe('functionTypeMapping undefined bug', () => {
  const payloadModel = new OutputModel(
    '',
    new ConstrainedAnyModel('TestPayloadModel', undefined, {}, 'Payload'),
    'TestPayloadModel',
    {models: {}, originalInput: undefined},
    []
  );

  const createHeadersDependency = (): TypeScriptHeadersRenderType => ({
    channelModels: {},
    generator: {outputPath: './test'} as any
  });

  // Helper to create a generator with functionTypeMapping explicitly set to undefined
  // This simulates the bug condition where spread operator preserves undefined
  const createGeneratorWithUndefinedFunctionTypeMapping = (protocols: string[]) => {
    const generator = {
      ...defaultTypeScriptChannelsGenerator,
      outputPath: path.resolve(__dirname, './output'),
      id: 'test',
      asyncapiGenerateForOperations: false,
      protocols
    };
    // Explicitly set to undefined to trigger the bug
    (generator as any).functionTypeMapping = undefined;
    return generator;
  };

  let parsedAsyncAPIDocument: any;
  let parametersDependency: TypeScriptParameterRenderType;
  let payloadsDependency: TypeScriptPayloadRenderType;

  beforeAll(async () => {
    parsedAsyncAPIDocument = await loadAsyncapiDocument(
      path.resolve(__dirname, '../../../../../configs/asyncapi.yaml')
    );

    const parameterModel = new OutputModel(
      '',
      new ConstrainedObjectModel(
        'TestParameter',
        undefined,
        {},
        'Parameter',
        {}
      ),
      'TestParameter',
      {models: {}, originalInput: undefined},
      []
    );

    parametersDependency = {
      channelModels: {
        'user/signedup': parameterModel
      },
      generator: {outputPath: './test'} as any
    };

    payloadsDependency = {
      channelModels: {
        'user/signedup': {
          messageModel: payloadModel,
          messageType: 'MessageType'
        }
      },
      operationModels: {},
      otherModels: [],
      generator: {outputPath: './test'} as any
    };
  });

  describe('should handle undefined functionTypeMapping without crashing', () => {
    it('NATS generator', async () => {
      await expect(
        generateTypeScriptChannels({
          generator: createGeneratorWithUndefinedFunctionTypeMapping(['nats']),
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        })
      ).resolves.not.toThrow();
    });

    it('Kafka generator', async () => {
      await expect(
        generateTypeScriptChannels({
          generator: createGeneratorWithUndefinedFunctionTypeMapping(['kafka']),
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        })
      ).resolves.not.toThrow();
    });

    it('MQTT generator', async () => {
      await expect(
        generateTypeScriptChannels({
          generator: createGeneratorWithUndefinedFunctionTypeMapping(['mqtt']),
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        })
      ).resolves.not.toThrow();
    });

    it('AMQP generator', async () => {
      await expect(
        generateTypeScriptChannels({
          generator: createGeneratorWithUndefinedFunctionTypeMapping(['amqp']),
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        })
      ).resolves.not.toThrow();
    });

    it('WebSocket generator', async () => {
      await expect(
        generateTypeScriptChannels({
          generator: createGeneratorWithUndefinedFunctionTypeMapping([
            'websocket'
          ]),
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        })
      ).resolves.not.toThrow();
    });

    it('EventSource generator', async () => {
      await expect(
        generateTypeScriptChannels({
          generator: createGeneratorWithUndefinedFunctionTypeMapping([
            'event_source'
          ]),
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        })
      ).resolves.not.toThrow();
    });

    it('HTTP client generator', async () => {
      // HTTP client needs request/reply pattern, use asyncapi-request.yaml
      const requestDoc = await loadAsyncapiDocument(
        path.resolve(__dirname, '../../../../../configs/asyncapi-request.yaml')
      );

      const httpPayloadsDependency: TypeScriptPayloadRenderType = {
        channelModels: {
          ping: {
            messageModel: payloadModel,
            messageType: 'MessageType'
          }
        },
        operationModels: {
          pingRequest: {
            messageModel: payloadModel,
            messageType: 'MessageType'
          },
          pongResponse: {
            messageModel: payloadModel,
            messageType: 'MessageType'
          },
          pingRequest_reply: {
            messageModel: payloadModel,
            messageType: 'MessageType'
          }
        },
        otherModels: [],
        generator: {outputPath: './test'} as any
      };

      const httpGenerator = createGeneratorWithUndefinedFunctionTypeMapping([
        'http_client'
      ]);
      // HTTP requires asyncapiGenerateForOperations: true
      httpGenerator.asyncapiGenerateForOperations = true;

      await expect(
        generateTypeScriptChannels({
          generator: httpGenerator,
          inputType: 'asyncapi',
          asyncapiDocument: requestDoc,
          dependencyOutputs: {
            'parameters-typescript': {
              channelModels: {},
              generator: {outputPath: './test'} as any
            },
            'payloads-typescript': httpPayloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        })
      ).resolves.not.toThrow();
    });

    it('all protocols together', async () => {
      // Test all AsyncAPI-compatible protocols together (excluding http_client which needs special setup)
      await expect(
        generateTypeScriptChannels({
          generator: createGeneratorWithUndefinedFunctionTypeMapping([
            'nats',
            'kafka',
            'mqtt',
            'amqp',
            'websocket',
            'event_source'
          ]),
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        })
      ).resolves.not.toThrow();
    });
  });
});
