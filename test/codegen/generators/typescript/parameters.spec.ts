import path from "node:path";
import { generateTypescriptParameters } from "../../../../src/codegen/generators";
import { loadAsyncapiDocument } from "../../../../src/codegen/inputs/asyncapi";
import { loadOpenapiDocument } from "../../../../src/codegen/inputs/openapi";

describe('parameters', () => {
  describe('typescript', () => {
    describe('asyncapi', () => {
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
        expect(renderedContent.channelModels['multiple_parameter']?.result).toMatchSnapshot();
      });
      it('should work with AsyncAPI v2 that contains parameters and const parameters', async () => {
        const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/parameters-v2.yaml'));
        
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
        expect(renderedContent.channelModels['multiple_parameter']?.result).toMatchSnapshot();
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
    
    describe('openapi', () => {
      it('should work with OpenAPI 3.0 that contains parameters', async () => {
        const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-3.json'));
        
        const renderedContent = await generateTypescriptParameters({
          generator: {
            serializationType: 'json',
            outputPath: path.resolve(__dirname, './output'),
            preset: 'parameters',
            language: 'typescript',
            dependencies: [],
            id: 'test'
          },
          inputType: 'openapi',
          openapiDocument: parsedOpenAPIDocument,
          dependencyOutputs: { }
        });
        
        expect(Object.keys(renderedContent.channelModels).length).toEqual(12);
        // Check that parameters were generated for operations with path/query parameters
        expect(renderedContent.channelModels['deleteOrder']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['deletePet']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['deleteUser']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['findPetsByStatus']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['findPetsByTags']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['getOrderById']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['getPetById']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['getUserByName']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['loginUser']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['updatePetWithForm']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['updateUser']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['uploadFile']?.result).toMatchSnapshot();
      });
      
      it('should work with OpenAPI 3.1 that contains parameters', async () => {
        const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-3_1.json'));
        
        const renderedContent = await generateTypescriptParameters({
          generator: {
            serializationType: 'json',
            outputPath: path.resolve(__dirname, './output'),
            preset: 'parameters',
            language: 'typescript',
            dependencies: [],
            id: 'test'
          },
          inputType: 'openapi',
          openapiDocument: parsedOpenAPIDocument,
          dependencyOutputs: { }
        });
        
        expect(Object.keys(renderedContent.channelModels).length).toEqual(12);
        // Check that parameters were generated for operations with path/query parameters
        expect(renderedContent.channelModels['deleteOrder']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['deletePet']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['deleteUser']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['findPetsByStatus']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['findPetsByTags']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['getOrderById']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['getPetById']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['getUserByName']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['loginUser']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['updatePetWithForm']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['updateUser']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['uploadFile']?.result).toMatchSnapshot();
      });
      
      it('should work with OpenAPI 2.0 that contains parameters', async () => {
        const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-2.json'));
        
        const renderedContent = await generateTypescriptParameters({
          generator: {
            serializationType: 'json',
            outputPath: path.resolve(__dirname, './output'),
            preset: 'parameters',
            language: 'typescript',
            dependencies: [],
            id: 'test'
          },
          inputType: 'openapi',
          openapiDocument: parsedOpenAPIDocument,
          dependencyOutputs: { }
        });
        
        expect(Object.keys(renderedContent.channelModels).length).toEqual(12);
        // Check that some parameters were generated (the exact operation IDs may differ in OpenAPI 2.0)
        expect(renderedContent.channelModels['deleteOrder']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['deletePet']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['deleteUser']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['findPetsByStatus']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['findPetsByTags']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['getOrderById']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['getPetById']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['getUserByName']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['loginUser']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['updatePetWithForm']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['updateUser']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['uploadFile']?.result).toMatchSnapshot();
      });
      
      it('should handle empty OpenAPI document with no operations', async () => {
        // Create a minimal OpenAPI document with no paths/operations
        const minimalOpenAPIDoc = {
          openapi: '3.0.0',
          info: {
            title: 'Test API',
            version: '1.0.0'
          },
          paths: {}
        };
        
        const renderedContent = await generateTypescriptParameters({
          generator: {
            serializationType: 'json',
            outputPath: path.resolve(__dirname, './output'),
            preset: 'parameters',
            language: 'typescript',
            dependencies: [],
            id: 'test'
          },
          inputType: 'openapi',
          openapiDocument: minimalOpenAPIDoc,
          dependencyOutputs: { }
        });
        
        expect(Object.keys(renderedContent.channelModels).length).toEqual(0);
      });
    });
  });
});
