import path from "node:path";
import type { OpenAPIV3 } from "openapi-types";
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

      it('should use constrained property names and skip parseFromUrl without query parameters', async () => {
        const openAPIDoc: OpenAPIV3.Document = {
          openapi: '3.0.0',
          info: {
            title: 'Test API',
            version: '1.0.0'
          },
          paths: {
            '/v2/documents/{documentId}': {
              get: {
                operationId: 'getDocument',
                parameters: [
                  {
                    name: 'documentId',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' }
                  }
                ],
                responses: { 200: { description: 'ok' } }
              }
            },
            '/v2/transactions': {
              get: {
                operationId: 'getTransactions',
                parameters: [
                  {
                    name: 'Skip',
                    in: 'query',
                    required: false,
                    schema: { type: 'integer' }
                  },
                  {
                    name: 'Cvr',
                    in: 'query',
                    required: false,
                    schema: { type: 'string' }
                  }
                ],
                responses: { 200: { description: 'ok' } }
              }
            }
          }
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
          openapiDocument: openAPIDoc,
          dependencyOutputs: { }
        });

        // Path-only parameters: interface exists but no parseFromUrl function (no query params)
        expect(renderedContent.channelModels['getDocument']).toBeDefined();
        const pathOnlyFile = renderedContent.files.find(f => f.path.endsWith('GetDocumentParameters.ts'));
        expect(pathOnlyFile).toBeDefined();
        expect(pathOnlyFile?.content).not.toContain('parseFromUrl');

        // Non-camelCase names: serialize/parse functions use constrained property names and raw wire names
        expect(renderedContent.channelModels['getTransactions']).toBeDefined();
        const queryFile = renderedContent.files.find(f => f.path.endsWith('GetTransactionsParameters.ts'));
        expect(queryFile).toBeDefined();
        expect(queryFile?.content).not.toContain('parameters.Skip');
        expect(queryFile?.content).not.toContain('parameters.Cvr');
        expect(queryFile?.content).toContain('parameters.skip');
        expect(queryFile?.content).toContain('parameters.cvr');
        expect(queryFile?.content).toContain(`'Skip'`);
        expect(queryFile?.content).toContain(`'Cvr'`);

        expect(renderedContent.channelModels['getDocument']?.result).toMatchSnapshot();
        expect(renderedContent.channelModels['getTransactions']?.result).toMatchSnapshot();
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
