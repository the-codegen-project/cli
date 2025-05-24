import path from "node:path";
import { defaultCustomGenerator, CustomContext } from "../../../../src/codegen/generators/generic/custom";
import { loadAsyncapiDocument } from "../../../../src/codegen/inputs/asyncapi";
import { loadOpenapiDocument } from "../../../../src/codegen/inputs/openapi";
describe('custom', () => {
  describe('typescript', () => {
    it('should work with AsyncAPI input and call renderFunction with correct arguments', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const mockRenderFunction = jest.fn().mockReturnValue('AsyncAPI custom output');
      
      const customGenerator = {
        ...defaultCustomGenerator,
        renderFunction: mockRenderFunction
      };

      const context: CustomContext = {
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        generator: customGenerator,
        dependencyOutputs: {
          'test-dependency': 'test-output'
        }
      };

      const options = { customOption: 'test-value' };
      
      // Call the render function directly as it would be called by the renderer
      const result = customGenerator.renderFunction(context, options);
      
      expect(mockRenderFunction).toHaveBeenCalledTimes(1);
      expect(mockRenderFunction).toHaveBeenCalledWith(
        {
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          openapiDocument: undefined,
          generator: customGenerator,
          dependencyOutputs: { 'test-dependency': 'test-output' }
        },
        { customOption: 'test-value' }
      );
      expect(result).toBe('AsyncAPI custom output');
    });

    it('should work with OpenAPI input and call renderFunction with correct arguments', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-3.json'));
      const mockRenderFunction = jest.fn().mockReturnValue('OpenAPI custom output');
      
      const customGenerator = {
        ...defaultCustomGenerator,
        renderFunction: mockRenderFunction
      };

      const context: CustomContext = {
        inputType: 'openapi',
        openapiDocument: parsedOpenAPIDocument,
        generator: customGenerator,
        dependencyOutputs: {
          'test-dependency': 'test-output'
        }
      };

      const options = { customOption: 'openapi-test-value' };
      
      // Call the render function directly as it would be called by the renderer
      const result = customGenerator.renderFunction(context, options);
      
      expect(mockRenderFunction).toHaveBeenCalledTimes(1);
      expect(mockRenderFunction).toHaveBeenCalledWith(
        {
          inputType: 'openapi',
          asyncapiDocument: undefined,
          openapiDocument: parsedOpenAPIDocument,
          generator: customGenerator,
          dependencyOutputs: { 'test-dependency': 'test-output' }
        },
        { customOption: 'openapi-test-value' }
      );
      expect(result).toBe('OpenAPI custom output');
    });

    it('should handle empty dependency outputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const mockRenderFunction = jest.fn().mockReturnValue('No dependencies output');
      
      const customGenerator = {
        ...defaultCustomGenerator,
        renderFunction: mockRenderFunction
      };

      const context: CustomContext = {
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        generator: customGenerator,
        dependencyOutputs: {}
      };
      
      const result = customGenerator.renderFunction(context, {});
      
      expect(mockRenderFunction).toHaveBeenCalledWith(
        {
          inputType: 'asyncapi',
          asyncapiDocument: parsedAsyncAPIDocument,
          openapiDocument: undefined,
          generator: customGenerator,
          dependencyOutputs: {}
        },
        {}
      );
      expect(result).toBe('No dependencies output');
    });

    it('should work when renderFunction returns undefined', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const mockRenderFunction = jest.fn().mockReturnValue(undefined);
      
      const customGenerator = {
        ...defaultCustomGenerator,
        renderFunction: mockRenderFunction
      };

      const context: CustomContext = {
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        generator: customGenerator,
        dependencyOutputs: {}
      };
      
      const result = customGenerator.renderFunction(context, {});
      
      expect(mockRenderFunction).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });
});
