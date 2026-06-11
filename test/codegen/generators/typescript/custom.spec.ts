import path from "node:path";
import { defaultCustomGenerator } from "../../../../src/codegen/generators/generic/custom";
import { CustomGeneratorInput } from "../../../../src/codegen/generators/generic/custom.input";
import { loadAsyncapiDocument } from "../../../../src/codegen/inputs/asyncapi";
import { loadOpenapiDocument } from "../../../../src/codegen/inputs/openapi";

function emptyTypedInputs(): CustomGeneratorInput['inputs'] {
  return {
    payloads: { channelPayloads: {}, operationPayloads: {}, otherPayloads: [] },
    parameters: { channelParameters: {} },
    headers: { channelHeaders: {} },
    types: { outputStyle: 'topics', emitIds: false, addresses: [] },
    channels: { channels: [] },
    client: { channels: [], securitySchemes: [] },
    models: {}
  };
}

describe('custom', () => {
  describe('typescript', () => {
    it('should call renderFunction with the typed CustomGeneratorInput shape (AsyncAPI)', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const mockRenderFunction = jest.fn().mockReturnValue('AsyncAPI custom output');

      const customGenerator = {
        ...defaultCustomGenerator,
        renderFunction: mockRenderFunction
      };

      const customInput: CustomGeneratorInput = {
        inputs: emptyTypedInputs(),
        rawDocuments: { asyncapi: parsedAsyncAPIDocument },
        inputType: 'asyncapi',
        generator: customGenerator,
        dependencyOutputs: { 'test-dependency': 'test-output' }
      };

      const options = { customOption: 'test-value' };
      const result = customGenerator.renderFunction(customInput, options);

      expect(mockRenderFunction).toHaveBeenCalledTimes(1);
      const [actualInput, actualOptions] = mockRenderFunction.mock.calls[0];
      expect(actualInput.inputType).toBe('asyncapi');
      expect(actualInput.rawDocuments.asyncapi).toBe(parsedAsyncAPIDocument);
      expect(actualInput.rawDocuments.openapi).toBeUndefined();
      expect(actualInput.dependencyOutputs).toEqual({ 'test-dependency': 'test-output' });
      expect(actualInput.inputs).toBeDefined();
      expect(actualOptions).toEqual({ customOption: 'test-value' });
      expect(result).toBe('AsyncAPI custom output');
    });

    it('should call renderFunction with the typed CustomGeneratorInput shape (OpenAPI)', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-3.json'));
      const mockRenderFunction = jest.fn().mockReturnValue('OpenAPI custom output');

      const customGenerator = {
        ...defaultCustomGenerator,
        renderFunction: mockRenderFunction
      };

      const customInput: CustomGeneratorInput = {
        inputs: emptyTypedInputs(),
        rawDocuments: { openapi: parsedOpenAPIDocument },
        inputType: 'openapi',
        generator: customGenerator,
        dependencyOutputs: { 'test-dependency': 'test-output' }
      };

      const options = { customOption: 'openapi-test-value' };
      const result = customGenerator.renderFunction(customInput, options);

      expect(mockRenderFunction).toHaveBeenCalledTimes(1);
      const [actualInput, actualOptions] = mockRenderFunction.mock.calls[0];
      expect(actualInput.inputType).toBe('openapi');
      expect(actualInput.rawDocuments.asyncapi).toBeUndefined();
      expect(actualInput.rawDocuments.openapi).toBe(parsedOpenAPIDocument);
      expect(actualInput.dependencyOutputs).toEqual({ 'test-dependency': 'test-output' });
      expect(actualOptions).toEqual({ customOption: 'openapi-test-value' });
      expect(result).toBe('OpenAPI custom output');
    });

    it('should handle empty dependency outputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const mockRenderFunction = jest.fn().mockReturnValue('No dependencies output');

      const customGenerator = {
        ...defaultCustomGenerator,
        renderFunction: mockRenderFunction
      };

      const customInput: CustomGeneratorInput = {
        inputs: emptyTypedInputs(),
        rawDocuments: { asyncapi: parsedAsyncAPIDocument },
        inputType: 'asyncapi',
        generator: customGenerator,
        dependencyOutputs: {}
      };

      const result = customGenerator.renderFunction(customInput, {});
      const [actualInput] = mockRenderFunction.mock.calls[0];
      expect(actualInput.dependencyOutputs).toEqual({});
      expect(result).toBe('No dependencies output');
    });

    it('should work when renderFunction returns undefined', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/asyncapi.yaml'));
      const mockRenderFunction = jest.fn().mockReturnValue(undefined);

      const customGenerator = {
        ...defaultCustomGenerator,
        renderFunction: mockRenderFunction
      };

      const customInput: CustomGeneratorInput = {
        inputs: emptyTypedInputs(),
        rawDocuments: { asyncapi: parsedAsyncAPIDocument },
        inputType: 'asyncapi',
        generator: customGenerator,
        dependencyOutputs: {}
      };

      const result = customGenerator.renderFunction(customInput, {});

      expect(mockRenderFunction).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });
  });
});
