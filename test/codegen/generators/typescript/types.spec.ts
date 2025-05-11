import path from "node:path";
import { loadAsyncapi } from "../../../helpers";
import { generateTypescriptTypes } from "../../../../src/codegen/generators";

describe('types', () => {
  describe('typescript', () => {
    it('should work with basic AsyncAPI 2.x inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapi(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      
      const renderedContent = await generateTypescriptTypes({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'types',
          language: 'typescript',
          dependencies: [],
          id: 'test'
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.result).toMatchSnapshot();
    });
    it('should work with basic AsyncAPI 3.x inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapi(path.resolve(__dirname, '../../../configs/asyncapi-3.yaml'));
      
      const renderedContent = await generateTypescriptTypes({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'types',
          language: 'typescript',
          dependencies: [],
          id: 'test'
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.result).toMatchSnapshot();
    });
  });
});
