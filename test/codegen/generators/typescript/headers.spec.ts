import path from "node:path";
import { loadAsyncapi } from "../../../helpers";
import { generateTypescriptHeaders } from "../../../../src/codegen/generators/typescript/headers";

describe('headers', () => {
  describe('typescript', () => {
    it('should work with basic AsyncAPI inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapi(path.resolve(__dirname, '../../../configs/headers.yaml'));
      
      const renderedContent = await generateTypescriptHeaders({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'headers',
          language: 'typescript',
          dependencies: [],
          serializationType: 'json',
          id: 'test'
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.channelModels['simple']!.result).toMatchSnapshot();
    });
  });
});
