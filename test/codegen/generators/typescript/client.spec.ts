import path from "node:path";
import { defaultTypeScriptClientGenerator, generateTypeScriptClient, TypeScriptParameterRenderType } from "../../../../src/codegen/generators";
import { loadAsyncapiDocument } from "../../../../src/codegen/inputs/asyncapi";
import { ConstrainedAnyModel, ConstrainedObjectModel, OutputModel } from "@asyncapi/modelina";
import { ChannelFunctionTypes, defaultTypeScriptChannelsGenerator, TypeScriptChannelRenderType } from "../../../../src/codegen/generators/typescript/channels";
import { TypeScriptPayloadRenderType } from "../../../../src/codegen/generators/typescript/payloads";

describe('client', () => {
  describe('typescript', () => {
    it('should work with basic AsyncAPI inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const payloadModel = new OutputModel('', new ConstrainedAnyModel('', undefined, {}, 'Payload'), '', {models: {}, originalInput: undefined}, []);
      const parameterModel = new OutputModel('', new ConstrainedObjectModel('', undefined, {}, 'Parameter', {}), '', {models: {}, originalInput: undefined}, []);
      
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
            messageType: 'TestMessageType',
          }
        },
        operationModels: {},
        otherModels: [],
        generator: {outputPath: './test'} as any,
        files: []
      };
      const channelsDependency: TypeScriptChannelRenderType = {
        payloadRender: payloadsDependency,
        result: '',
        parameterRender: parametersDependency,
        renderedFunctions: {
          nats: [
            {
              functionName: 'Test',
              functionType: ChannelFunctionTypes.NATS_PUBLISH,
              messageType: 'TestMessageType',
              parameterType: 'TestParameterType'
            },
            {
              functionName: 'Test',
              functionType: ChannelFunctionTypes.NATS_SUBSCRIBE,
              messageType: 'TestMessageType',
              parameterType: 'TestParameterType'
            },
            {
              functionName: 'Test',
              functionType: ChannelFunctionTypes.NATS_JETSTREAM_PUBLISH,
              messageType: 'TestMessageType',
              parameterType: 'TestParameterType'
            },
            {
              functionName: 'Test',
              functionType: ChannelFunctionTypes.NATS_JETSTREAM_PULL_SUBSCRIBE,
              messageType: 'TestMessageType',
              parameterType: 'TestParameterType'
            },
            {
              functionName: 'Test',
              functionType: ChannelFunctionTypes.NATS_JETSTREAM_PUSH_SUBSCRIBE,
              messageType: 'TestMessageType',
              parameterType: 'TestParameterType'
            }
          ]
        },
        generator: defaultTypeScriptChannelsGenerator,
        protocolFiles: {},
        files: []
      };
      const result = await generateTypeScriptClient({
        generator: defaultTypeScriptClientGenerator,
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: {
          'parameters-typescript': parametersDependency,
          'payloads-typescript': payloadsDependency,
          'channels-typescript': channelsDependency
        }
      });
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should generate an HTTP client class from OpenAPI inputs', async () => {
      const payloadModel = new OutputModel('', new ConstrainedAnyModel('', undefined, {}, 'Payload'), '', {models: {}, originalInput: undefined}, []);
      const parametersDependency: TypeScriptParameterRenderType = {
        channelModels: {},
        generator: {outputPath: './test'} as any,
        files: []
      };
      const payloadsDependency: TypeScriptPayloadRenderType = {
        channelModels: {},
        operationModels: {
          'getV2Documents': {
            messageModel: payloadModel,
            messageType: 'GetV2DocumentsResponse_200',
          }
        },
        otherModels: [],
        generator: {outputPath: './test'} as any,
        files: []
      };
      const channelsDependency: TypeScriptChannelRenderType = {
        payloadRender: payloadsDependency,
        result: '',
        parameterRender: parametersDependency,
        renderedFunctions: {
          http_client: [
            {
              functionName: 'getV2Documents',
              functionType: ChannelFunctionTypes.HTTP_CLIENT,
              messageType: '',
              replyType: 'GetV2DocumentsResponse_200'
            }
          ]
        },
        generator: defaultTypeScriptChannelsGenerator,
        protocolFiles: {},
        files: []
      };
      const result = await generateTypeScriptClient({
        generator: {...defaultTypeScriptClientGenerator, protocols: ['http']},
        inputType: 'openapi',
        openapiDocument: {info: {title: 'Safepay API'}} as any,
        dependencyOutputs: {
          'parameters-typescript': parametersDependency,
          'payloads-typescript': payloadsDependency,
          'channels-typescript': channelsDependency
        }
      });
      expect(result.files.length).toBe(1);
      expect(result.files[0].path).toContain('SafepayClient.ts');
      expect(result.files[0].content).toContain('export class SafepayClient');
      expect(result.files[0].content).toContain('public async getV2Documents(');
      expect(result.files[0].content).toContain('http_client.getV2Documents({...this.config, ...context})');
    });

    it('does not emit a client for a protocol with no rendered functions', async () => {
      const parametersDependency: TypeScriptParameterRenderType = {
        channelModels: {},
        generator: {outputPath: './test'} as any,
        files: []
      };
      const payloadsDependency: TypeScriptPayloadRenderType = {
        channelModels: {},
        operationModels: {},
        otherModels: [],
        generator: {outputPath: './test'} as any,
        files: []
      };
      const channelsDependency: TypeScriptChannelRenderType = {
        payloadRender: payloadsDependency,
        result: '',
        parameterRender: parametersDependency,
        renderedFunctions: {http_client: []},
        generator: defaultTypeScriptChannelsGenerator,
        protocolFiles: {},
        files: []
      };
      const result = await generateTypeScriptClient({
        generator: {...defaultTypeScriptClientGenerator, protocols: ['nats', 'http']},
        inputType: 'openapi',
        openapiDocument: {info: {title: 'Empty API'}} as any,
        dependencyOutputs: {
          'parameters-typescript': parametersDependency,
          'payloads-typescript': payloadsDependency,
          'channels-typescript': channelsDependency
        }
      });
      expect(result.files.length).toBe(0);
    });
  });
});
