import path from "node:path";
import { generateTypescriptParameters } from "../../../../src/codegen/generators";
import { loadAsyncapiDocument } from "../../../../src/codegen/inputs/asyncapi";

describe('payloads', () => {
  describe('typescript', () => {
    it('should work with AsyncAPI that contains parameters', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/parameters.yaml'));
      
      const renderedContent = await generateTypescriptParameters({
        generator: {
          serializationType: 'json',
          outputPath: path.resolve(__dirname, './output'),
          preset: 'parameters',
          language: 'typescript',
          dependencies: [],
          id: 'test'
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.channelModels['single_parameter']?.result).toMatchSnapshot();
      expect(renderedContent.channelModels['second_parameter']?.result).toMatchSnapshot();
    });
    it('should work with no channels', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/parameters-no-channels.yaml'));
      
      const renderedContent = await generateTypescriptParameters({
        generator: {
          serializationType: 'json',
          outputPath: path.resolve(__dirname, './output'),
          preset: 'parameters',
          language: 'typescript',
          dependencies: [],
          id: 'test'
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(Object.keys(renderedContent.channelModels).length).toEqual(0);
    });
  });
});
