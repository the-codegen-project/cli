import path from "node:path";
import { defaultTypeScriptChannelsGenerator, generateTypeScriptChannels, TypeScriptParameterRenderType } from "../../../../src/codegen/generators";
import { loadAsyncapiDocument, loadAsyncapiFromMemory } from "../../../../src/codegen/inputs/asyncapi";
import { loadOpenapiDocument } from "../../../../src/codegen/inputs/openapi";
import { ConstrainedAnyModel, ConstrainedArrayModel, ConstrainedIntegerModel, ConstrainedObjectModel, ConstrainedObjectPropertyModel, ConstrainedStringModel, OutputModel } from "@asyncapi/modelina";
import { TypeScriptPayloadRenderType } from "../../../../src/codegen/generators/typescript/payloads";
import { TypeScriptHeadersRenderType } from "../../../../src/codegen/generators/typescript/headers";

describe('channels', () => {
  describe('typescript', () => {
    const payloadModel = new OutputModel('', new ConstrainedAnyModel('TestPayloadModel', undefined, {}, 'Payload'), 'TestPayloadModel', {models: {}, originalInput: undefined}, []);
    const parameterModel = new OutputModel('', new ConstrainedObjectModel('TestParameter', undefined, {}, 'Parameter', {}), 'TestParameter', {models: {}, originalInput: undefined}, []);

    // Helper function to create mock headers dependency
    const createHeadersDependency = (): TypeScriptHeadersRenderType => ({
      channelModels: {},
      generator: {outputPath: './test'} as any,
      files: []
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
      const parsedAsyncAPIDocument = await loadAsyncapiDocument({documentPath: path.resolve(__dirname, '../../../configs/asyncapi.yaml')});
      const parametersDependency: TypeScriptParameterRenderType = {
        channelModels: {
          "user/signedup": parameterModel
        },
        generator: {outputPath: './test'} as any,
        files: []
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
        generator: {outputPath: './test'} as any,
        files: []
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
      expect(generatedChannels.files.length).toBeGreaterThan(0);
      expect(generatedChannels.result).toMatchSnapshot();
    });
    it('should work with request and reply AsyncAPI', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument({documentPath: path.resolve(__dirname, '../../../configs/asyncapi-request.yaml')});
      const parametersDependency: TypeScriptParameterRenderType = {
        channelModels: {},
        generator: {outputPath: './test'} as any,
        files: []
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
        generator: {outputPath: './test'} as any,
        files: []
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
      expect(generatedChannels.files.length).toBeGreaterThan(0);
      expect(generatedChannels.result).toMatchSnapshot();
    });
    it('should work with basic AsyncAPI inputs with no parameters', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument({documentPath: path.resolve(__dirname, '../../../configs/asyncapi.yaml')});

      const parametersDependency: TypeScriptParameterRenderType = {
        channelModels: {
        },
        generator: {outputPath: './test'} as any,
        files: []
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
        generator: {outputPath: './test'} as any,
        files: []
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
      expect(generatedChannels.files.length).toBeGreaterThan(0);
      expect(generatedChannels.result).toMatchSnapshot();
    });
    it('should work with operation extension', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiFromMemory({input: JSON.stringify({
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
      })});

      const parametersDependency: TypeScriptParameterRenderType = {
        channelModels: {
        },
        generator: {outputPath: './test'} as any,
        files: []
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
        generator: {outputPath: './test'} as any,
        files: []
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
      expect(generatedChannels.files.length).toBeGreaterThan(0);
      expect(generatedChannels.result).toMatchSnapshot();
    });

    describe('protocol-specific code generation', () => {
      // Use asyncapi-channels.yaml which has actual parameters, payloads, and headers
      const setupWithParametersAndHeaders = async () => {
        const parsedAsyncAPIDocument = await loadAsyncapiDocument({documentPath: path.resolve(__dirname, '../../../configs/asyncapi-channels.yaml')});

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
          generator: {outputPath: './parameters'} as any,
          files: []
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
          generator: {outputPath: './payloads'} as any,
          files: []
        };

        const headersDependency: TypeScriptHeadersRenderType = {
          channelModels: {
            userSignedup: headerModel,
            noParameter: headerModel
          },
          generator: {outputPath: './headers'} as any,
          files: []
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

        expect(generatedChannels.files.length).toBeGreaterThan(0);
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

        expect(generatedChannels.files.length).toBeGreaterThan(0);
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

        expect(generatedChannels.files.length).toBeGreaterThan(0);
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

        expect(generatedChannels.files.length).toBeGreaterThan(0);
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

        expect(generatedChannels.files.length).toBeGreaterThan(0);
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

        expect(generatedChannels.files.length).toBeGreaterThan(0);
        expect(generatedChannels.result).toMatchSnapshot('websocket-index');
        expect(generatedChannels.protocolFiles['websocket']).toMatchSnapshot('websocket-protocol-code');
      });

      it('should generate HTTP client protocol code for request/reply', async () => {
        const parsedAsyncAPIDocument = await loadAsyncapiDocument({documentPath: path.resolve(__dirname, '../../../configs/asyncapi-request.yaml')});

        const parametersDependency: TypeScriptParameterRenderType = {
          channelModels: {},
          generator: {outputPath: './parameters'} as any,
          files: []
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
          generator: {outputPath: './payloads'} as any,
          files: []
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

        expect(generatedChannels.files.length).toBeGreaterThan(0);
        expect(generatedChannels.result).toMatchSnapshot('http_client-index');
        expect(generatedChannels.protocolFiles['http_client']).toMatchSnapshot('http_client-protocol-code');

        // AsyncAPI declares no error responses, so handleHttpError is
        // default-only (no explicit numeric cases / switch), but the typed
        // HttpError class is still exported.
        const httpProtocolCode = generatedChannels.protocolFiles['http_client'];
        expect(httpProtocolCode).toContain('export class HttpError extends Error');
        expect(httpProtocolCode).toContain(
          'function handleHttpError(status: number, statusText: string, body?: unknown): never {\n  throw new HttpError(`HTTP Error: ${status} ${statusText}`, status, statusText, body);\n}'
        );
        expect(httpProtocolCode).not.toMatch(/case \d+:/);
      });
    });

    describe('payload companion interface widening', () => {
      // An object payload (ConstrainedObjectModel) gains a companion interface,
      // so its user-facing input sites must widen to `Interface | Class` and
      // normalize to a class instance before `.marshal()`.
      const objectPayloadModel = new OutputModel(
        '',
        new ConstrainedObjectModel('UserSignedUpPayload', undefined, {}, 'object', {}),
        'UserSignedUpPayload',
        {models: {}, originalInput: undefined},
        []
      );

      const generateBrokerProtocol = async (protocol: string) => {
        const parsedAsyncAPIDocument = await loadAsyncapiDocument({documentPath: path.resolve(__dirname, '../../../configs/asyncapi-channels.yaml')});
        const objectPayload = {
          messageModel: objectPayloadModel,
          messageType: 'UserSignedUpPayload'
        };
        const payloadsDependency: TypeScriptPayloadRenderType = {
          channelModels: {
            userSignedup: objectPayload,
            noParameter: objectPayload
          },
          operationModels: {},
          otherModels: [],
          generator: {outputPath: './payloads'} as any,
          files: []
        };
        const parametersDependency: TypeScriptParameterRenderType = {
          channelModels: {
            userSignedup: createParameterModelWithProperties({
              myParameter: new ConstrainedStringModel('myParameter', undefined, {}, 'string')
            }),
            noParameter: undefined
          },
          generator: {outputPath: './parameters'} as any,
          files: []
        };
        const generatedChannels = await generateTypeScriptChannels({
          generator: {
            ...defaultTypeScriptChannelsGenerator,
            outputPath: path.resolve(__dirname, './output'),
            id: 'test',
            asyncapiGenerateForOperations: false,
            protocols: [protocol as any]
          },
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        });
        return generatedChannels.protocolFiles[protocol];
      };

      it.each(['nats', 'kafka', 'mqtt', 'amqp', 'websocket'])(
        'should widen the %s publish input site to Interface | Class and normalize before marshal',
        async (protocol) => {
          const code = await generateBrokerProtocol(protocol);
          expect(code).toContain(
            'UserSignedUpPayloadInterface | UserSignedUpPayload'
          );
          // Normalization guard before marshalling the payload.
          expect(code).toContain('instanceof UserSignedUpPayload');
          // Dual import of the payload class and its companion interface.
          expect(code).toContain(
            'import {UserSignedUpPayload, UserSignedUpPayloadInterface}'
          );
        }
      );

      it('should widen the HTTP client payload input site (POST body) and import the companion interface', async () => {
        // openapi-3.json's addPet is a POST with a `Pet` object request body —
        // the only HTTP shape that carries a payload to widen.
        const parsedOpenAPIDocument = await loadOpenapiDocument(
          path.resolve(__dirname, '../../../runtime/openapi-3.json')
        );
        const petPayloadModel = new OutputModel(
          '',
          new ConstrainedObjectModel('Pet', undefined, {}, 'object', {}),
          'Pet',
          {models: {}, originalInput: undefined},
          []
        );
        const petPayload = {messageModel: petPayloadModel, messageType: 'Pet'};
        const payloadsDependency: TypeScriptPayloadRenderType = {
          channelModels: {},
          operationModels: {
            addPet: petPayload,
            addPet_Response: petPayload
          },
          otherModels: [],
          generator: {outputPath: './payloads'} as any,
          files: []
        };
        const generatedChannels = await generateTypeScriptChannels({
          generator: {
            ...defaultTypeScriptChannelsGenerator,
            outputPath: path.resolve(__dirname, './output'),
            id: 'test',
            asyncapiGenerateForOperations: true,
            protocols: ['http_client']
          },
          inputType: 'openapi',
          openapiDocument: parsedOpenAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': {
              channelModels: {},
              generator: {outputPath: './parameters'} as any,
              files: []
            },
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        });
        const code = generatedChannels.protocolFiles['http_client'];
        // Context `payload` field widened to `Interface | Class`.
        expect(code).toContain('payload: PetInterface | Pet;');
        // Body normalized to a class instance before marshal.
        expect(code).toContain('instanceof Pet');
        expect(code).toContain('import {Pet, PetInterface}');
      });
    });

    describe('OpenAPI input', () => {
      it('should generate HTTP client protocol code for OpenAPI spec', async () => {
        const parsedOpenAPIDocument = await loadOpenapiDocument(
          path.resolve(__dirname, '../../../runtime/openapi-3.json')
        );

        // Create parameter model for findPetsByStatusAndCategory operation
        const statusProperty = new ConstrainedObjectPropertyModel(
          'status',
          'status',
          true,
          new ConstrainedStringModel('status', undefined, {}, 'string')
        );
        const categoryIdProperty = new ConstrainedObjectPropertyModel(
          'categoryId',
          'categoryId',
          true,
          new ConstrainedIntegerModel('categoryId', undefined, {}, 'number')
        );
        const findPetsByStatusAndCategoryParams = new OutputModel(
          '',
          new ConstrainedObjectModel('FindPetsByStatusAndCategoryParameters', undefined, {}, 'Parameter', {
            status: statusProperty,
            categoryId: categoryIdProperty
          }),
          'FindPetsByStatusAndCategoryParameters',
          {models: {}, originalInput: undefined},
          []
        );

        const parametersDependency: TypeScriptParameterRenderType = {
          channelModels: {
            findPetsByStatusAndCategory: findPetsByStatusAndCategoryParams
          },
          generator: {outputPath: './parameters'} as any,
          files: []
        };

        const petPayloadModel = new OutputModel('', new ConstrainedObjectModel('Pet', undefined, {}, 'object', {}), 'Pet', {models: {}, originalInput: undefined}, []);

        // Create array model for Pet[] response
        const petArrayModel = new ConstrainedArrayModel(
          'Pet[]', 
          undefined,
          {},
          'Pet[]',
          petPayloadModel.model
        );

        const petArrayPayloadModel = new OutputModel(
          '',
          petArrayModel,
          'FindPetsByStatusAndCategoryResponse',
          {models: {}, originalInput: undefined},
          []
        );

        const payloadsDependency: TypeScriptPayloadRenderType = {
          channelModels: {},
          operationModels: {
            // Request payloads (for POST/PUT with body)
            addPet: {
              messageModel: petPayloadModel,
              messageType: 'Pet'
            },
            updatePet: {
              messageModel: petPayloadModel,
              messageType: 'Pet'
            },
            // Response payloads
            addPet_Response: {
              messageModel: petPayloadModel,
              messageType: 'Pet'
            },
            updatePet_Response: {
              messageModel: petPayloadModel,
              messageType: 'Pet'
            },
            findPetsByStatusAndCategory_Response: {
              messageModel: petArrayPayloadModel,
              messageType: 'Pet[]'
            }
          },
          otherModels: [],
          generator: {outputPath: './payloads'} as any,
          files: []
        };

        const xRequestIdProperty = new ConstrainedObjectPropertyModel(
          'xRequestId',
          'X-Request-ID',
          false,
          new ConstrainedStringModel('string', undefined, {}, 'string')
        );
        const acceptLanguageProperty = new ConstrainedObjectPropertyModel(
          'acceptLanguage',
          'Accept-Language',
          false,
          new ConstrainedStringModel('string', undefined, {}, 'string')
        );
        const findPetsByStatusAndCategoryHeadersModel = new OutputModel(
          '',
          new ConstrainedObjectModel('FindPetsByStatusAndCategoryHeaders', undefined, {}, 'FindPetsByStatusAndCategoryHeaders', {
            xRequestId: xRequestIdProperty,
            acceptLanguage: acceptLanguageProperty
          }),
          'FindPetsByStatusAndCategoryHeaders',
          {models: {}, originalInput: undefined},
          []
        );
        const headersDependency: TypeScriptHeadersRenderType = {
          channelModels: {
            findPetsByStatusAndCategory: findPetsByStatusAndCategoryHeadersModel
          },
          generator: {outputPath: './headers'} as any,
          files: [],
          headerFunctions: {
            FindPetsByStatusAndCategoryHeaders: ['serializeFindPetsByStatusAndCategoryHeadersHeaders']
          }
        };

        const generatedChannels = await generateTypeScriptChannels({
          generator: {
            ...defaultTypeScriptChannelsGenerator,
            outputPath: path.resolve(__dirname, './output'),
            id: 'test',
            asyncapiGenerateForOperations: true,
            protocols: ['http_client']
          },
          inputType: 'openapi',
          openapiDocument: parsedOpenAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': headersDependency
          }
        });

        expect(generatedChannels.files.length).toBeGreaterThan(0);
        expect(generatedChannels.result).toMatchSnapshot('openapi-http_client-index');
        expect(generatedChannels.protocolFiles['http_client']).toMatchSnapshot('openapi-http_client-protocol-code');

        // Responses are unmarshalled from the raw JSON text, not the parsed
        // object, so primitive-typed payloads whose unmarshal JSON.parses its
        // argument keep working. See fix/openapi-http-client-primitive-response.
        const httpProtocolCode = generatedChannels.protocolFiles['http_client'];
        expect(httpProtocolCode).toContain('unmarshal(JSON.stringify(rawData))');
        expect(httpProtocolCode).not.toMatch(/unmarshal\(rawData\)/);

        // Error handling is input-driven: openapi-3.json declares 400/404/405
        // across its operations, so handleHttpError emits an explicit case per
        // code (aggregated document-wide) throwing a typed HttpError with the
        // standard reason phrase. The typed HttpError class is always exported.
        expect(httpProtocolCode).toContain('export class HttpError extends Error');
        expect(httpProtocolCode).toContain(
          'case 400:\n      throw new HttpError("Bad Request", status, statusText, body);'
        );
        expect(httpProtocolCode).toContain(
          'case 404:\n      throw new HttpError("Not Found", status, statusText, body);'
        );
        expect(httpProtocolCode).toContain(
          'case 405:\n      throw new HttpError("Method Not Allowed", status, statusText, body);'
        );
        // Undeclared codes fall through to the generic default handler.
        expect(httpProtocolCode).toContain(
          'throw new HttpError(`HTTP Error: ${status} ${statusText}`, status, statusText, body);'
        );
        // The per-operation error branch parses and forwards the error body.
        expect(httpProtocolCode).toContain(
          'const errorBody = await response.json().catch(() => undefined);'
        );

        // Operations with path parameters must expose their parameter model name via
        // parameterType so downstream consumers (e.g. README generation) know the
        // operation requires a `parameters` argument. Operations without parameters
        // must leave it undefined. Regression guard for the previously hardcoded
        // `parameterType: undefined`.
        const httpFunctions = generatedChannels.renderedFunctions['http_client'];
        const withParameters = httpFunctions.find(
          (fn) => fn.functionName === 'findPetsByStatusAndCategory'
        );
        expect(withParameters?.parameterType).toBe('FindPetsByStatusAndCategoryParameters');
        const withoutParameters = httpFunctions.find(
          (fn) => fn.functionName !== 'findPetsByStatusAndCategory'
        );
        expect(withoutParameters).toBeDefined();
        expect(withoutParameters?.parameterType).toBeUndefined();
      });

      it('should skip generation when http_client is not in protocols', async () => {
        const parsedOpenAPIDocument = await loadOpenapiDocument(
          path.resolve(__dirname, '../../../runtime/openapi-3.json')
        );

        const parametersDependency: TypeScriptParameterRenderType = {
          channelModels: {},
          generator: {outputPath: './parameters'} as any,
          files: []
        };

        const payloadsDependency: TypeScriptPayloadRenderType = {
          channelModels: {},
          operationModels: {},
          otherModels: [],
          generator: {outputPath: './payloads'} as any,
          files: []
        };

        const generatedChannels = await generateTypeScriptChannels({
          generator: {
            ...defaultTypeScriptChannelsGenerator,
            outputPath: path.resolve(__dirname, './output'),
            id: 'test',
            asyncapiGenerateForOperations: true,
            protocols: ['nats'] // Not http_client
          },
          inputType: 'openapi',
          openapiDocument: parsedOpenAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        });

        expect(generatedChannels.files.length).toBeGreaterThan(0);
        // Should not generate any http_client code
        expect(generatedChannels.protocolFiles['http_client']).toBeUndefined();
      });
    });

    describe('organization', () => {
      // Shared OpenAPI (openapi-3.json) setup: three `pet`-tagged operations,
      // POST /pet -> addPet, PUT /pet -> updatePet,
      // GET /pet/findByStatus/{status}/{categoryId} -> findPetsByStatusAndCategory.
      const generateOpenApiChannels = async (
        organization: 'flat' | 'tag' | 'path'
      ) => {
        const parsedOpenAPIDocument = await loadOpenapiDocument(
          path.resolve(__dirname, '../../../runtime/openapi-3.json')
        );
        const statusProperty = new ConstrainedObjectPropertyModel(
          'status',
          'status',
          true,
          new ConstrainedStringModel('status', undefined, {}, 'string')
        );
        const categoryIdProperty = new ConstrainedObjectPropertyModel(
          'categoryId',
          'categoryId',
          true,
          new ConstrainedIntegerModel('categoryId', undefined, {}, 'number')
        );
        const findPetsByStatusAndCategoryParams = new OutputModel(
          '',
          new ConstrainedObjectModel('FindPetsByStatusAndCategoryParameters', undefined, {}, 'Parameter', {
            status: statusProperty,
            categoryId: categoryIdProperty
          }),
          'FindPetsByStatusAndCategoryParameters',
          {models: {}, originalInput: undefined},
          []
        );
        const parametersDependency: TypeScriptParameterRenderType = {
          channelModels: {
            findPetsByStatusAndCategory: findPetsByStatusAndCategoryParams
          },
          generator: {outputPath: './parameters'} as any,
          files: []
        };
        const petPayloadModel = new OutputModel('', new ConstrainedObjectModel('Pet', undefined, {}, 'object', {}), 'Pet', {models: {}, originalInput: undefined}, []);
        const petArrayModel = new ConstrainedArrayModel('Pet[]', undefined, {}, 'Pet[]', petPayloadModel.model);
        const petArrayPayloadModel = new OutputModel('', petArrayModel, 'FindPetsByStatusAndCategoryResponse', {models: {}, originalInput: undefined}, []);
        const payloadsDependency: TypeScriptPayloadRenderType = {
          channelModels: {},
          operationModels: {
            addPet: {messageModel: petPayloadModel, messageType: 'Pet'},
            updatePet: {messageModel: petPayloadModel, messageType: 'Pet'},
            addPet_Response: {messageModel: petPayloadModel, messageType: 'Pet'},
            updatePet_Response: {messageModel: petPayloadModel, messageType: 'Pet'},
            findPetsByStatusAndCategory_Response: {messageModel: petArrayPayloadModel, messageType: 'Pet[]'}
          },
          otherModels: [],
          generator: {outputPath: './payloads'} as any,
          files: []
        };
        return generateTypeScriptChannels({
          generator: {
            ...defaultTypeScriptChannelsGenerator,
            outputPath: path.resolve(__dirname, './output'),
            id: 'test',
            asyncapiGenerateForOperations: true,
            protocols: ['http_client'],
            organization
          },
          inputType: 'openapi',
          openapiDocument: parsedOpenAPIDocument,
          dependencyOutputs: {
            'parameters-typescript': parametersDependency,
            'payloads-typescript': payloadsDependency,
            'headers-typescript': createHeadersDependency()
          }
        });
      };

      it('flat keeps the current namespace barrel unchanged (regression guard)', async () => {
        const generated = await generateOpenApiChannels('flat');
        expect(generated.result).toBe(
          `import * as http_client from './http_client';\n\nexport {http_client};\n`
        );
      });

      it('tag groups OpenAPI operations under their tag with verbatim leaf names', async () => {
        const generated = await generateOpenApiChannels('tag');
        expect(generated.result).toContain(
          `import * as internal_http_client from './http_client';`
        );
        expect(generated.result).toContain('export const http_client = {');
        expect(generated.result).toContain('pet: {');
        expect(generated.result).toContain('addPet: internal_http_client.addPet');
        expect(generated.result).toContain('updatePet: internal_http_client.updatePet');
        expect(generated.result).toContain(
          'findPetsByStatusAndCategory: internal_http_client.findPetsByStatusAndCategory'
        );
        expect(generated.result).toContain('} as const;');
        expect(generated.result).toMatchSnapshot('openapi-tag-index');
      });

      it('path nests OpenAPI operations by path segment with the HTTP method as the leaf', async () => {
        const generated = await generateOpenApiChannels('path');
        expect(generated.result).toContain('export const http_client = {');
        expect(generated.result).toContain('pet: {');
        expect(generated.result).toContain('post: internal_http_client.addPet');
        expect(generated.result).toContain('put: internal_http_client.updatePet');
        expect(generated.result).toContain('findByStatus: {');
        expect(generated.result).toContain(
          'get: internal_http_client.findPetsByStatusAndCategory'
        );
        expect(generated.result).toMatchSnapshot('openapi-path-index');
      });

      it('populates grouping metadata on the rendered functions', async () => {
        const generated = await generateOpenApiChannels('tag');
        const functions = generated.renderedFunctions['http_client'];
        expect(functions.length).toBeGreaterThan(0);
        const addPet = functions.find((fn) => fn.functionName === 'addPet');
        expect(addPet?.tags).toEqual(['pet']);
        expect(addPet?.pathSegments).toEqual(['pet']);
        expect(addPet?.method).toBe('post');
        const findPets = functions.find(
          (fn) => fn.functionName === 'findPetsByStatusAndCategory'
        );
        expect(findPets?.pathSegments).toEqual(['pet', 'findByStatus']);
        expect(findPets?.method).toBe('get');
      });
    });
  });
});
