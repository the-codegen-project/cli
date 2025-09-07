import path from "node:path";
import { defaultTypeScriptChannelsGenerator, generateTypeScriptChannels, TypeScriptParameterRenderType } from "../../../../src/codegen/generators";
import { loadAsyncapiDocument, loadAsyncapiFromMemory } from "../../../../src/codegen/inputs/asyncapi";
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));
import fs from 'node:fs/promises';
import { ConstrainedAnyModel, ConstrainedObjectModel, OutputModel } from "@asyncapi/modelina";
import { TypeScriptPayloadRenderType } from "../../../../src/codegen/generators/typescript/payloads";
import { TypeScriptHeadersRenderType } from "../../../../src/codegen/generators/typescript/headers";

describe('channels', () => {
  describe('typescript', () => {
    const payloadModel = new OutputModel('', new ConstrainedAnyModel('TestPayloadModel', undefined, {}, 'Payload'), 'TestPayloadModel', {models: {}, originalInput: undefined}, []);
    const parameterModel = new OutputModel('', new ConstrainedObjectModel('TestParameter', undefined, {}, 'Parameter', {}), 'TestParameter', {models: {}, originalInput: undefined}, []);
    
    // Helper function to create mock headers dependency
    const createHeadersDependency = (): TypeScriptHeadersRenderType => ({
      channelModels: {},
      generator: {outputPath: './test'} as any
    });
    
    it('should work with basic AsyncAPI inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const parametersDependency: TypeScriptParameterRenderType = {
        channelModels: {
          "user/signedup": parameterModel
        },
        generator: {outputPath: './test'} as any
      };
      const payloadsDependency: TypeScriptPayloadRenderType = {
        channelModels: {
          "user/signedup": {
            messageModel: payloadModel,
            messageType: 'MessageType'
          }
        },
        operationModels: {},
        otherModels: [],
        generator: {outputPath: './test'} as any
      };
      const generatedChannels = await generateTypeScriptChannels({
        generator: {
          ...defaultTypeScriptChannelsGenerator,
          outputPath: path.resolve(__dirname, './output'),
          id: 'test',
          asyncapiGenerateForOperations: false,
          protocols: ['nats', 'amqp', 'mqtt', 'kafka', 'event_source']
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: {
          'parameters-typescript': parametersDependency,
          'payloads-typescript': payloadsDependency,
          'headers-typescript': createHeadersDependency()
        }
      });
      expect(fs.writeFile).toHaveBeenCalled();
      expect(generatedChannels.result).toMatchSnapshot();
    });
    it('should work with request and reply AsyncAPI', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi-request.yaml'));
      const parametersDependency: TypeScriptParameterRenderType = {
        channelModels: {},
        generator: {outputPath: './test'} as any
      };
      const payloadsDependency: TypeScriptPayloadRenderType = {
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
          },
        },
        otherModels: [],
        generator: {outputPath: './test'} as any
      };
      const generatedChannels = await generateTypeScriptChannels({
        generator: {
          ...defaultTypeScriptChannelsGenerator,
          outputPath: path.resolve(__dirname, './output'),
          id: 'test',
          asyncapiGenerateForOperations: true,
          protocols: ['http_client']
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: {
          'parameters-typescript': parametersDependency,
          'payloads-typescript': payloadsDependency,
          'headers-typescript': createHeadersDependency()
        }
      });
      expect(fs.writeFile).toHaveBeenCalled();
      expect(generatedChannels.result).toMatchSnapshot();
    });
    it('should work with basic AsyncAPI inputs with no parameters', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      
      const parametersDependency: TypeScriptParameterRenderType = {
        channelModels: {
        },
        generator: {outputPath: './test'} as any
      };
      const payloadsDependency: TypeScriptPayloadRenderType = {
        channelModels: {
          "user/signedup": {
            messageModel: payloadModel,
            messageType: 'MessageType'
          }
        },
        operationModels: {},
        otherModels: [],
        generator: {outputPath: './test'} as any
      };
      const generatedChannels = await generateTypeScriptChannels({
        generator: {
          ...defaultTypeScriptChannelsGenerator,
          outputPath: path.resolve(__dirname, './output'),
          id: 'test',
          asyncapiGenerateForOperations: false,
          protocols: ['nats', 'amqp', 'mqtt', 'kafka', 'event_source']
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: {
          'parameters-typescript': parametersDependency,
          'payloads-typescript': payloadsDependency,
          'headers-typescript': createHeadersDependency()
        }
      });
      expect(fs.writeFile).toHaveBeenCalled();
      expect(generatedChannels.result).toMatchSnapshot();
    });
    it('should work with operation extension', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiFromMemory(JSON.stringify({
        asyncapi: "2.6.0",
        info: {
          title: "Account Service",
          version: "1.0.0",
          description: "This service is in charge of processing user signups"
        },
        channels: {
          "user/signedup": {
            publish: {
              message: {
                payload: {}
              }
            },
            "x-the-codegen-project": {
              functionTypeMapping: ["nats_jetstream_publish"]
            }
          }
        }
      }));
      
      const parametersDependency: TypeScriptParameterRenderType = {
        channelModels: {
        },
        generator: {outputPath: './test'} as any
      };
      const payloadsDependency: TypeScriptPayloadRenderType = {
        channelModels: {
          "user/signedup": {
            messageModel: payloadModel,
            messageType: 'MessageType'
          }
        },
        operationModels: {},
        otherModels: [],
        generator: {outputPath: './test'} as any
      };
      const generatedChannels = await generateTypeScriptChannels({
        generator: {
          ...defaultTypeScriptChannelsGenerator,
          outputPath: path.resolve(__dirname, './output'),
          id: 'test',
          asyncapiGenerateForOperations: false,
          protocols: ['nats']
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: {
          'parameters-typescript': parametersDependency,
          'payloads-typescript': payloadsDependency,
          'headers-typescript': createHeadersDependency()
        }
      });
      expect(fs.writeFile).toHaveBeenCalled();
      expect(generatedChannels.result).toMatchSnapshot();
    });
  });
});
