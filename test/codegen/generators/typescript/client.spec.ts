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
  });
});
