import path from "node:path";
import { defaultTypeScriptClientGenerator, generateTypeScriptClient, TypeScriptParameterRenderType } from "../../../../src/codegen/generators";
import { loadAsyncapi } from "../../../helpers";
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));
import fs from 'node:fs/promises';
import { ConstrainedAnyModel, ConstrainedObjectModel, OutputModel } from "@asyncapi/modelina";
import { ChannelFunctionTypes, defaultTypeScriptChannelsGenerator, TypeScriptChannelRenderType } from "../../../../src/codegen/generators/typescript/channels";
import { TypeScriptPayloadRenderType } from "../../../../src/codegen/generators/typescript/payloads";

describe('client', () => {
  describe('typescript', () => {
    it('should work with basic AsyncAPI inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapi(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const payloadModel = new OutputModel('', new ConstrainedAnyModel('', undefined, {}, 'Payload'), '', {models: {}, originalInput: undefined}, []);
      const parameterModel = new OutputModel('', new ConstrainedObjectModel('', undefined, {}, 'Parameter', {}), '', {models: {}, originalInput: undefined}, []);
      
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
            messageType: 'TestMessageType',
          }
        },
        operationModels: {},
        otherModels: [],
        generator: {outputPath: './test'} as any
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
        generator: defaultTypeScriptChannelsGenerator
      };
      await generateTypeScriptClient({
        generator: defaultTypeScriptClientGenerator,
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: {
          'parameters-typescript': parametersDependency,
          'payloads-typescript': payloadsDependency,
          'channels-typescript': channelsDependency
        }
      });
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});
