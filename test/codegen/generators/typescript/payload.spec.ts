import path from "node:path";
import { generateTypescriptPayload } from "../../../../src/codegen/generators";
import { loadAsyncapi } from "../../../helpers";

describe('payloads', () => {
  describe('typescript', () => {
    it('should work with basic AsyncAPI inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapi(path.resolve(__dirname, '../../../configs/payload.yaml'));
      
      const renderedContent = await generateTypescriptPayload({
        generator: {
          enum: 'enum',
          map: 'record',
          rawPropertyNames: false,
          serializationType: 'json',
          useForJavaScript: false,
          outputPath: path.resolve(__dirname, './output'),
          preset: 'payloads',
          language: 'typescript',
          dependencies: [],
          id: 'test'
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.channelModels['union'].messageModel.result).toMatchSnapshot();
      expect(renderedContent.channelModels['simple'].messageModel.result).toMatchSnapshot();
    });
    it('should work with no channels', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapi(path.resolve(__dirname, '../../../configs/payload-no-channels.yaml'));
      
      const renderedContent = await generateTypescriptPayload({
        generator: {
          enum: 'enum',
          map: 'record',
          rawPropertyNames: false,
          serializationType: 'json',
          useForJavaScript: false,
          outputPath: path.resolve(__dirname, './output'),
          preset: 'payloads',
          language: 'typescript',
          dependencies: [],
          id: 'test'
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.otherModels.length).toEqual(1);
      expect(renderedContent.otherModels[0].messageModel.result).toMatchSnapshot();
    });
  });
});
