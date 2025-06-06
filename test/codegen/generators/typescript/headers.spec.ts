import path from "node:path";
import { loadAsyncapiDocument } from "../../../../src/codegen/inputs/asyncapi";
import { generateTypescriptHeaders } from "../../../../src/codegen/generators/typescript/headers";
import { loadOpenapiDocument } from "../../../../src/codegen/inputs/openapi";

describe('headers', () => {
  describe('typescript', () => {
    it('should work with basic AsyncAPI inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/headers.yaml'));
      
      const renderedContent = await generateTypescriptHeaders({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'headers',
          language: 'typescript',
          dependencies: [],
          serializationType: 'json',
          id: 'test',
          includeValidation: true
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.channelModels['simple']!.result).toMatchSnapshot();
    });
    it('should work with OpenAPI 2.0 inputs', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-2.json'));
      
      const renderedContent = await generateTypescriptHeaders({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'headers',
          language: 'typescript',
          dependencies: [],
          serializationType: 'json',
          includeValidation: true,
          id: 'test'
        },
        inputType: 'openapi',
        openapiDocument: parsedOpenAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.channelModels['deletePet']!.result).toMatchSnapshot();
    });
    it('should work with OpenAPI 3.0 inputs', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-3.json'));
      
      const renderedContent = await generateTypescriptHeaders({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'headers',
          language: 'typescript',
          dependencies: [],
          serializationType: 'json',
          id: 'test',
          includeValidation: true
        },
        inputType: 'openapi',
        openapiDocument: parsedOpenAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.channelModels['deletePet']!.result).toMatchSnapshot();
    });
    it('should work with OpenAPI 3.1 inputs', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-3.json'));
      
      const renderedContent = await generateTypescriptHeaders({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'headers',
          language: 'typescript',
          dependencies: [],
          serializationType: 'json',
          includeValidation: true,
          id: 'test'
        },
        inputType: 'openapi',
        openapiDocument: parsedOpenAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.channelModels['deletePet']!.result).toMatchSnapshot();
    });
  });
});
