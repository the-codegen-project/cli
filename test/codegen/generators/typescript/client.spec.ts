import path from "node:path";
import { defaultTypeScriptClientGenerator, generateTypeScriptClient, TypeScriptPayloadGenerator } from "../../../../src/codegen/generators";
import { loadAsyncapi } from "../../../helpers";
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));
import fs from 'node:fs/promises';

import { ParameterRenderType, PayloadRenderType } from "../../../../src/codegen/types";
import { ConstrainedAnyModel, ConstrainedObjectModel, OutputModel } from "@asyncapi/modelina";
import { ChannelFunctionTypes, defaultTypeScriptChannelsGenerator, TypeScriptChannelRenderType } from "../../../../src/codegen/generators/typescript/channels";

describe('client', () => {
  describe('typescript', () => {
    it('should work with basic AsyncAPI inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapi(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const payloadModel = new OutputModel('', new ConstrainedAnyModel('', undefined, {}, 'Payload'), '', {models: {}, originalInput: undefined}, []);
      const parameterModel = new OutputModel('', new ConstrainedObjectModel('', undefined, {}, 'Parameter', {}), '', {models: {}, originalInput: undefined}, []);
      
      const parametersDependency: ParameterRenderType = {
        channelModels: {
          "user/signedup": parameterModel
        },
        generator: {outputPath: './test'} as any
      };
      const payloadsDependency: PayloadRenderType<TypeScriptPayloadGenerator> = {
        channelModels: {
          "user/signedup": {
            messageModel: payloadModel,
            messageType: 'TestMessageType'
          }
        },
        generator: {outputPath: './test'} as any
      };
      const channelsDependency: TypeScriptChannelRenderType = {
        payloadRender: payloadsDependency,
        parameterRender: parametersDependency,
        renderedFunctions: {
          nats: [
            {
              functionName: 'Test',
              functionType: ChannelFunctionTypes.NATS_CORE_PUBLISH,
              messageType: 'TestMessageType',
              parameterType: 'TestParameterType'
            },
            {
              functionName: 'Test',
              functionType: ChannelFunctionTypes.NATS_CORE_SUBSCRIBE,
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
        generator: defaultTypeScriptChannelsGenerator as any
      };
      await generateTypeScriptClient({
        generator: defaultTypeScriptClientGenerator as any,
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
