import path from "node:path";
import { defaultTypeScriptChannelsGenerator, generateTypeScriptChannels, TypeScriptParameterRenderType } from "../../../../src/codegen/generators";
import { loadAsyncapiDocument, loadAsyncapiFromMemory } from "../../../../src/codegen/inputs/asyncapi";
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));
import fs from 'node:fs/promises';
import { ConstrainedAnyModel, ConstrainedObjectModel, ConstrainedStringModel, OutputModel } from "@asyncapi/modelina";
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

    // Helper to create parameter model with properties for channels that have actual parameters
    const createParameterModelWithProperties = (properties: Record<string, any>) => {
      return new OutputModel(
        '',
        new ConstrainedObjectModel('TestParameter', undefined, {}, 'Parameter', properties),
        'TestParameter',
        {models: {}, originalInput: undefined},
        []
      );
    };

    // Helper to create header model with properties
    const createHeaderModel = (properties: Record<string, any>) => {
      return new OutputModel(
        '',
        new ConstrainedObjectModel('TestHeaders', undefined, {}, 'Headers', properties),
        'TestHeaders',
        {models: {}, originalInput: undefined},
        []
      );
    };

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

    describe('protocol-specific code generation', () => {
      // Use asyncapi-channels.yaml which has actual parameters, payloads, and headers
      const setupWithParametersAndHeaders = async () => {
        const parsedAsyncAPIDocument = await loadAsyncapiDocument(
          path.resolve(__dirname, '../../../configs/asyncapi-channels.yaml')
        );

        // Create parameter models that match the fixture's channel parameters
        const userSignedupParameterModel = createParameterModelWithProperties({
          myParameter: new ConstrainedStringModel('myParameter', undefined, {}, 'string'),
          enumParameter: new ConstrainedStringModel('enumParameter', undefined, {}, 'string')
        });

        // Create header model that matches the fixture's headers
        const headerModel = createHeaderModel({
          xTestHeader: new ConstrainedStringModel('xTestHeader', undefined, {}, 'string')
        });

        const parametersDependency: TypeScriptParameterRenderType = {
          channelModels: {
            userSignedup: userSignedupParameterModel,
            noParameter: undefined
          },
          generator: {outputPath: './parameters'} as any
        };

        const payloadsDependency: TypeScriptPayloadRenderType = {
          channelModels: {
            userSignedup: {
              messageModel: payloadModel,
              messageType: 'UserSignedUpPayload'
            },
            noParameter: {
              messageModel: payloadModel,
              messageType: 'UserSignedUpPayload'
            }
          },
          operationModels: {
            sendUserSignedup: {
              messageModel: payloadModel,
              messageType: 'UserSignedUpPayload'
            },
            receiveUserSignedup: {
              messageModel: payloadModel,
              messageType: 'UserSignedUpPayload'
            },
            sendNoParameter: {
              messageModel: payloadModel,
              messageType: 'UserSignedUpPayload'
            },
            receiveNoParameter: {
              messageModel: payloadModel,
              messageType: 'UserSignedUpPayload'
            }
          },
          otherModels: [],
          generator: {outputPath: './payloads'} as any
        };

        const headersDependency: TypeScriptHeadersRenderType = {
          channelModels: {
            userSignedup: headerModel,
            noParameter: headerModel
          },
          generator: {outputPath: './headers'} as any
        };

        return { parsedAsyncAPIDocument, parametersDependency, payloadsDependency, headersDependency };
      };

      it('should generate NATS protocol code with parameters and headers', async () => {
        const { parsedAsyncAPIDocument, parametersDependency, payloadsDependency, headersDependency } = await setupWithParametersAndHeaders();

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
            'headers-typescript': headersDependency
          }
        });

        expect(fs.writeFile).toHaveBeenCalled();
        expect(generatedChannels.result).toMatchSnapshot('nats-index');
        expect(generatedChannels.protocolFiles['nats']).toMatchSnapshot('nats-protocol-code');
      });

      it('should generate Kafka protocol code with parameters and headers', async () => {
        const { parsedAsyncAPIDocument, parametersDependency, payloadsDependency, headersDependency } = await setupWithParametersAndHeaders();

        const generatedChannels = await generateTypeScriptChannels({
          generator: {
            ...defaultTypeScriptChannelsGenerator,
            outputPath: path.resolve(__dirname, './output'),
            id: 'test',
            asyncapiGenerateForOperations: false,
            protocols: ['kafka']
          },
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': headersDependency
          }
        });

        expect(fs.writeFile).toHaveBeenCalled();
        expect(generatedChannels.result).toMatchSnapshot('kafka-index');
        expect(generatedChannels.protocolFiles['kafka']).toMatchSnapshot('kafka-protocol-code');
      });

      it('should generate MQTT protocol code with parameters and headers', async () => {
        const { parsedAsyncAPIDocument, parametersDependency, payloadsDependency, headersDependency } = await setupWithParametersAndHeaders();

        const generatedChannels = await generateTypeScriptChannels({
          generator: {
            ...defaultTypeScriptChannelsGenerator,
            outputPath: path.resolve(__dirname, './output'),
            id: 'test',
            asyncapiGenerateForOperations: false,
            protocols: ['mqtt']
          },
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': headersDependency
          }
        });

        expect(fs.writeFile).toHaveBeenCalled();
        expect(generatedChannels.result).toMatchSnapshot('mqtt-index');
        expect(generatedChannels.protocolFiles['mqtt']).toMatchSnapshot('mqtt-protocol-code');
      });

      it('should generate AMQP protocol code with parameters and headers', async () => {
        const { parsedAsyncAPIDocument, parametersDependency, payloadsDependency, headersDependency } = await setupWithParametersAndHeaders();

        const generatedChannels = await generateTypeScriptChannels({
          generator: {
            ...defaultTypeScriptChannelsGenerator,
            outputPath: path.resolve(__dirname, './output'),
            id: 'test',
            asyncapiGenerateForOperations: false,
            protocols: ['amqp']
          },
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': headersDependency
          }
        });

        expect(fs.writeFile).toHaveBeenCalled();
        expect(generatedChannels.result).toMatchSnapshot('amqp-index');
        expect(generatedChannels.protocolFiles['amqp']).toMatchSnapshot('amqp-protocol-code');
      });

      it('should generate EventSource protocol code with parameters and headers', async () => {
        const { parsedAsyncAPIDocument, parametersDependency, payloadsDependency, headersDependency } = await setupWithParametersAndHeaders();

        const generatedChannels = await generateTypeScriptChannels({
          generator: {
            ...defaultTypeScriptChannelsGenerator,
            outputPath: path.resolve(__dirname, './output'),
            id: 'test',
            asyncapiGenerateForOperations: false,
            protocols: ['event_source']
          },
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': headersDependency
          }
        });

        expect(fs.writeFile).toHaveBeenCalled();
        expect(generatedChannels.result).toMatchSnapshot('event_source-index');
        expect(generatedChannels.protocolFiles['event_source']).toMatchSnapshot('event_source-protocol-code');
      });

      it('should generate WebSocket protocol code with parameters and headers', async () => {
        const { parsedAsyncAPIDocument, parametersDependency, payloadsDependency, headersDependency } = await setupWithParametersAndHeaders();

        const generatedChannels = await generateTypeScriptChannels({
          generator: {
            ...defaultTypeScriptChannelsGenerator,
            outputPath: path.resolve(__dirname, './output'),
            id: 'test',
            asyncapiGenerateForOperations: false,
            protocols: ['websocket']
          },
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': headersDependency
          }
        });

        expect(fs.writeFile).toHaveBeenCalled();
        expect(generatedChannels.result).toMatchSnapshot('websocket-index');
        expect(generatedChannels.protocolFiles['websocket']).toMatchSnapshot('websocket-protocol-code');
      });

      it('should generate HTTP client protocol code for request/reply', async () => {
        const parsedAsyncAPIDocument = await loadAsyncapiDocument(
          path.resolve(__dirname, '../../../configs/asyncapi-request.yaml')
        );

        const parametersDependency: TypeScriptParameterRenderType = {
          channelModels: {},
          generator: {outputPath: './parameters'} as any
        };

        const payloadsDependency: TypeScriptPayloadRenderType = {
          channelModels: {
            ping: {
              messageModel: payloadModel,
              messageType: 'Ping'
            }
          },
          operationModels: {
            pingRequest: {
              messageModel: payloadModel,
              messageType: 'Ping'
            },
            pongResponse: {
              messageModel: payloadModel,
              messageType: 'Pong'
            },
            pingRequest_reply: {
              messageModel: payloadModel,
              messageType: 'Pong'
            }
          },
          otherModels: [],
          generator: {outputPath: './payloads'} as any
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
        expect(generatedChannels.result).toMatchSnapshot('http_client-index');
        expect(generatedChannels.protocolFiles['http_client']).toMatchSnapshot('http_client-protocol-code');
      });
    });
  });
});
