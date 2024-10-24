import path from "node:path";
import { generateTypeScriptChannels, TypeScriptPayloadGenerator } from "../../../../src/codegen/generators";
import { loadAsyncapi } from "../../../helpers";
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));
import fs from 'node:fs/promises';

import { ParameterRenderType, PayloadRenderType } from "../../../../src/codegen/types";
import { ConstrainedAnyModel, ConstrainedObjectModel, OutputModel } from "@asyncapi/modelina";

describe('channels', () => {
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
            messageType: 'MessageType'
          }
        },
        generator: {outputPath: './test'} as any
      };
      await generateTypeScriptChannels({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'channels',
          protocols: ['nats'],
          language: 'typescript',
          parameterGeneratorId: 'parameters-typescript',
          payloadGeneratorId: 'payloads-typescript',
          dependencies: ['parameters-typescript', 'payloads-typescript'],
          id: 'test'
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: {
          'parameters-typescript': parametersDependency,
          'payloads-typescript': payloadsDependency
        }
      });
      expect(fs.writeFile).toHaveBeenCalled();
    });
    it('should work with basic AsyncAPI inputs with no parameters', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapi(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const payloadModel = new OutputModel('', new ConstrainedAnyModel('', undefined, {}, 'Payload'), '', {models: {}, originalInput: undefined}, []);
      
      const parametersDependency: ParameterRenderType = {
        channelModels: {
        },
        generator: {outputPath: './test'} as any
      };
      const payloadsDependency: PayloadRenderType<TypeScriptPayloadGenerator> = {
        channelModels: {
          "user/signedup": {
            messageModel: payloadModel,
            messageType: 'MessageType'
          }
        },
        generator: {outputPath: './test'} as any
      };
      await generateTypeScriptChannels({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'channels',
          protocols: ['nats'],
          language: 'typescript',
          parameterGeneratorId: 'parameters-typescript',
          payloadGeneratorId: 'payloads-typescript',
          dependencies: ['parameters-typescript', 'payloads-typescript'],
          id: 'test'
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: {
          'parameters-typescript': parametersDependency,
          'payloads-typescript': payloadsDependency
        }
      });
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});
