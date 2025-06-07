import path from "node:path";
import { loadAsyncapiDocument } from "../../../../src/codegen/inputs/asyncapi";
import { loadOpenapiDocument } from "../../../../src/codegen/inputs/openapi/parser";
import { generateTypescriptTypes } from "../../../../src/codegen/generators";

describe('types', () => {
  describe('typescript', () => {
    it('should work with basic AsyncAPI 2.x inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      
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
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi-3.yaml'));
      
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
    it('should work with OpenAPI 2.0 inputs', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-2.json'));
      
      const renderedContent = await generateTypescriptTypes({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'types',
          language: 'typescript',
          dependencies: [],
          id: 'test'
        },
        inputType: 'openapi',
        openapiDocument: parsedOpenAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.result).toMatchSnapshot();
    });
    it('should work with OpenAPI 3.0 inputs', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-3.json'));
      
      const renderedContent = await generateTypescriptTypes({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'types',
          language: 'typescript',
          dependencies: [],
          id: 'test'
        },
        inputType: 'openapi',
        openapiDocument: parsedOpenAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.result).toMatchSnapshot();
    });
    it('should work with OpenAPI 3.1 inputs', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-3_1.json'));
      
      const renderedContent = await generateTypescriptTypes({
        generator: {
          outputPath: path.resolve(__dirname, './output'),
          preset: 'types',
          language: 'typescript',
          dependencies: [],
          id: 'test'
        },
        inputType: 'openapi',
        openapiDocument: parsedOpenAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.result).toMatchSnapshot();
    });
  });
});
