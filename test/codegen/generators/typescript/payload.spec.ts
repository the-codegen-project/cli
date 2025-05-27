import path from "node:path";
import { defaultTypeScriptPayloadGenerator, generateTypescriptPayload } from "../../../../src/codegen/generators";
import { loadAsyncapiDocument } from "../../../../src/codegen/inputs/asyncapi";
import { loadOpenapiDocument } from "../../../../src/codegen/inputs/openapi";
import { safeStringify } from "../../../../src/codegen/generators/typescript/payloads";

describe('payloads', () => {
  describe('typescript', () => {
    it('should work with basic AsyncAPI inputs', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/payload.yaml'));
      
      const renderedContent = await generateTypescriptPayload({
        generator: {
          ...defaultTypeScriptPayloadGenerator,
          outputPath: path.resolve(__dirname, './output')
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.channelModels['union'].messageModel.result).toMatchSnapshot();
      expect(renderedContent.channelModels['simple'].messageModel.result).toMatchSnapshot();
    });
    it('should not render validation functions', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/payload.yaml'));
      
      const renderedContent = await generateTypescriptPayload({
        generator: {
          ...defaultTypeScriptPayloadGenerator,
          includeValidation: false,
          outputPath: path.resolve(__dirname, './output')
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.channelModels['union'].messageModel.result).toMatchSnapshot();
      expect(renderedContent.channelModels['simple'].messageModel.result).toMatchSnapshot();
    });
    it('should work with no channels', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/payload-no-channels.yaml'));
      
      const renderedContent = await generateTypescriptPayload({
        generator: {
          ...defaultTypeScriptPayloadGenerator,
          outputPath: path.resolve(__dirname, './output')
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      expect(renderedContent.otherModels.length).toEqual(1);
      expect(renderedContent.otherModels[0].messageModel.result).toMatchSnapshot();
    });
    it('should get correct model names', async () => {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(path.resolve(__dirname, '../../../configs/payload-complex.json'));
      
      const renderedContent = await generateTypescriptPayload({
        generator: {
          ...defaultTypeScriptPayloadGenerator,
          outputPath: path.resolve(__dirname, './output')
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: { }
      });
      const payloadNames = renderedContent.otherModels.map((value) => value.messageModel.modelName);
      expect(payloadNames.includes('ComplexMessage')).toEqual(true);
      expect(payloadNames.includes('OpenApiGenerator')).toEqual(true);
      expect(payloadNames.includes('AsyncApiGenerator')).toEqual(true);
      expect(payloadNames.includes('DocumentContext')).toEqual(true);
      expect(payloadNames.includes('Simple')).toEqual(true);
      expect(payloadNames.includes('NpmRelease')).toEqual(true);
      expect(payloadNames.includes('GeneratorTypes')).toEqual(true);
      expect(payloadNames.includes('TypescriptNatsSettings')).toEqual(true);
      expect(payloadNames.includes('OpenapiTypescriptFetch')).toEqual(true);
    });
    
    it('should work with basic OpenAPI 2.0 inputs', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-2.json'));
      
      const renderedContent = await generateTypescriptPayload({
        generator: {
          ...defaultTypeScriptPayloadGenerator,
          outputPath: path.resolve(__dirname, './output')
        },
        inputType: 'openapi',
        openapiDocument: parsedOpenAPIDocument,
        dependencyOutputs: { }
      });
      const modelsCreated = Object.entries(renderedContent.operationModels).map(([key, value]) => ({key, value: value.messageModel.modelName}));
      expect(modelsCreated).toEqual([
        {
          key: "addPet",
          value: "AddPetRequest",
        },
        {
          key: "updatePet",
          value: "UpdatePetRequest",
        },
        {
          key: "placeOrder",
          value: "PlaceOrderRequest",
        },
        {
          key: "createUsersWithListInput",
          value: "CreateUsersWithListInputRequest",
        },
        {
          key: "updateUser",
          value: "UpdateUserRequest",
        },
        {
          key: "createUsersWithArrayInput",
          value: "CreateUsersWithArrayInputRequest",
        },
        {
          key: "createUser",
          value: "CreateUserRequest",
        },
        {
          key: "uploadFile_Response",
          value: "UploadFileResponse_200",
        },
        {
          key: "findPetsByStatus_Response",
          value: "FindPetsByStatusResponse_200",
        },
        {
          key: "findPetsByTags_Response",
          value: "FindPetsByTagsResponse_200",
        },
        {
          key: "getPetById_Response",
          value: "GetPetByIdResponse_200",
        },
        {
          key: "getInventory_Response",
          value: "GetInventoryResponse_200",
        },
        {
          key: "placeOrder_Response",
          value: "PlaceOrderResponse_200",
        },
        {
          key: "getOrderById_Response",
          value: "GetOrderByIdResponse_200",
        },
        {
          key: "getUserByName_Response",
          value: "GetUserByNameResponse_200",
        },
        {
          key: "loginUser_Response",
          value: "LoginUserResponse_200",
        },
      ]);
    });
    it('should work with basic OpenAPI 3.0 inputs', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-3.json'));
      
      const renderedContent = await generateTypescriptPayload({
        generator: {
          ...defaultTypeScriptPayloadGenerator,
          outputPath: path.resolve(__dirname, './output')
        },
        inputType: 'openapi',
        openapiDocument: parsedOpenAPIDocument,
        dependencyOutputs: { }
      });
      const modelsCreated = Object.entries(renderedContent.operationModels).map(([key, value]) => ({key, value: value.messageModel.modelName}));
      expect(modelsCreated).toEqual([
        {
          key: "addPet",
          value: "APet",
        },
        {
          key: "updatePet",
          value: "APet",
        },
        {
          key: "placeOrder",
          value: "PetOrder",
        },
        {
          key: "createUser",
          value: "AUser",
        },
        {
          key: "createUsersWithArrayInput",
          value: "CreateUsersWithArrayInputRequest",
        },
        {
          key: "createUsersWithListInput",
          value: "CreateUsersWithListInputRequest",
        },
        {
          key: "addPet_Response",
          value: "APet",
        },
        {
          key: "updatePet_Response",
          value: "APet",
        },
        {
          key: "findPetsByStatus_Response",
          value: "FindPetsByStatusResponse_200",
        },
        {
          key: "findPetsByTags_Response",
          value: "FindPetsByTagsResponse_200",
        },
        {
          key: "getPetById_Response",
          value: "APet",
        },
        {
          key: "uploadFile_Response",
          value: "AnUploadedResponse",
        },
        {
          key: "getInventory_Response",
          value: "GetInventoryResponse_200",
        },
        {
          key: "placeOrder_Response",
          value: "PetOrder",
        },
        {
          key: "getOrderById_Response",
          value: "PetOrder",
        },
        {
          key: "loginUser_Response",
          value: "LoginUserResponse_200",
        },
        {
          key: "getUserByName_Response",
          value: "AUser",
        },
      ]);
    });
    it('should work with basic OpenAPI 3.1 inputs', async () => {
      const parsedOpenAPIDocument = await loadOpenapiDocument(path.resolve(__dirname, '../../../configs/openapi-3_1.json'));
      
      const renderedContent = await generateTypescriptPayload({
        generator: {
          ...defaultTypeScriptPayloadGenerator,
          outputPath: path.resolve(__dirname, './output')
        },
        inputType: 'openapi',
        openapiDocument: parsedOpenAPIDocument,
        dependencyOutputs: { }
      });
      const modelsCreated = Object.entries(renderedContent.operationModels).map(([key, value]) => ({key, value: value.messageModel.modelName}));
      expect(modelsCreated).toEqual([
        {
          key: "addPet",
          value: "APet",
        },
        {
          key: "updatePet",
          value: "APet",
        },
        {
          key: "placeOrder",
          value: "PetOrder",
        },
        {
          key: "createUser",
          value: "AUser",
        },
        {
          key: "createUsersWithArrayInput",
          value: "CreateUsersWithArrayInputRequest",
        },
        {
          key: "createUsersWithListInput",
          value: "CreateUsersWithListInputRequest",
        },
        {
          key: "addPet_Response",
          value: "APet",
        },
        {
          key: "updatePet_Response",
          value: "APet",
        },
        {
          key: "findPetsByStatus_Response",
          value: "FindPetsByStatusResponse_200",
        },
        {
          key: "findPetsByTags_Response",
          value: "FindPetsByTagsResponse_200",
        },
        {
          key: "getPetById_Response",
          value: "APet",
        },
        {
          key: "uploadFile_Response",
          value: "AnUploadedResponse",
        },
        {
          key: "getInventory_Response",
          value: "GetInventoryResponse_200",
        },
        {
          key: "placeOrder_Response",
          value: "PetOrder",
        },
        {
          key: "getOrderById_Response",
          value: "PetOrder",
        },
        {
          key: "loginUser_Response",
          value: "LoginUserResponse_200",
        },
        {
          key: "getUserByName_Response",
          value: "AUser",
        },
      ]);
    });
    describe('safeStringify', () => {
      it('should stringify basic primitive values', () => {
        expect(safeStringify('hello')).toBe('"hello"');
        expect(safeStringify(42)).toBe('42');
        expect(safeStringify(true)).toBe('true');
        expect(safeStringify(false)).toBe('false');
        expect(safeStringify(null)).toBe('null');
      });

      it('should stringify simple objects', () => {
        const obj = { name: 'test', value: 123 };
        expect(safeStringify(obj)).toBe('{"name":"test","value":123}');
      });

      it('should stringify arrays', () => {
        const arr = [1, 'two', true, null];
        expect(safeStringify(arr)).toBe('[1,"two",true,null]');
      });

      it('should remove x-modelina extension properties', () => {
        const obj = {
          name: 'test',
          'x-modelina-type': 'string',
          'x-modelina-format': 'email',
          value: 123
        };
        expect(safeStringify(obj)).toBe('{"name":"test","value":123}');
      });

      it('should remove x-the-codegen-project extension properties', () => {
        const obj = {
          name: 'test',
          'x-the-codegen-project-version': '1.0.0',
          'x-the-codegen-project-config': { setting: true },
          value: 123
        };
        expect(safeStringify(obj)).toBe('{"name":"test","value":123}');
      });

      it('should handle circular references by replacing with true', () => {
        const obj: any = { name: 'test' };
        obj.self = obj;
        const result = safeStringify(obj);
        expect(result).toBe('{"name":"test","self":true}');
      });

      it('should handle nested circular references by cutting off after repetitions', () => {
        const parent: any = { name: 'parent' };
        const child: any = { name: 'child', parent };
        parent.child = child;
        
        const result = safeStringify(parent);
        // Should allow some repetition but eventually cut off with true
        expect(result).toContain('"name":"parent"');
        expect(result).toContain('"name":"child"');
        expect(result).toContain('true');
        // Should not be infinite
        expect(result.length).toBeLessThan(1000);
      });
      
      it('should handle multiple references to the same object', () => {
        const parent: any = { name: 'parent' };
        const root: any = { name: 'child', parent, parent_old: parent };
        
        const result = safeStringify(root);
        expect(result).toBe('{"name":"child","parent":{"name":"parent"},"parent_old":{"name":"parent"}}');
      });

      it('should replace functions with true', () => {
        const obj = {
          name: 'test',
          method() { return 'hello'; },
          arrow: () => 'world',
          value: 123
        };
        expect(safeStringify(obj)).toBe('{"name":"test","method":true,"arrow":true,"value":123}');
      });

      it('should handle deeply nested objects within recursion limit', () => {
        let nested: any = { value: 'deep' };
        for (let i = 0; i < 10; i++) {
          nested = { level: i, nested };
        }
        
        const result = safeStringify(nested);
        expect(result).toContain('"value":"deep"');
        expect(result).toContain('"level":0');
      });

      it('should handle objects beyond recursion limit by replacing with true', () => {
        let nested: any = { value: 'deep' };
        // Create a very deep nesting that exceeds the 255 limit
        for (let i = 0; i < 300; i++) {
          nested = { level: i, nested };
        }
        
        const result = safeStringify(nested);
        // Should contain true for deeply nested parts
        expect(result).toContain('true');
      });

      it('should handle mixed extension properties and regular properties', () => {
        const obj = {
          name: 'test',
          'x-modelina-discriminator': 'type',
          description: 'A test object',
          'x-the-codegen-project-id': 'test-id',
          properties: {
            field1: 'value1',
            'x-modelina-required': true,
            field2: 'value2'
          }
        };
        
        const result = safeStringify(obj);
        const parsed = JSON.parse(result);
        
        expect(parsed.name).toBe('test');
        expect(parsed.description).toBe('A test object');
        expect(parsed.properties.field1).toBe('value1');
        expect(parsed.properties.field2).toBe('value2');
        expect(parsed['x-modelina-discriminator']).toBeUndefined();
        expect(parsed['x-the-codegen-project-id']).toBeUndefined();
        expect(parsed.properties['x-modelina-required']).toBeUndefined();
      });

      it('should handle undefined values', () => {
        const obj = {
          name: 'test',
          undefinedValue: undefined,
          value: 123
        };
        expect(safeStringify(obj)).toBe('{"name":"test","value":123}');
      });

      it('should handle empty objects and arrays', () => {
        expect(safeStringify({})).toBe('{}');
        expect(safeStringify([])).toBe('[]');
      });

      it('should handle complex nested structures with extension properties', () => {
        const complex = {
          schema: {
            type: 'object',
            'x-modelina-type': 'CustomType',
            properties: {
              name: {
                type: 'string',
                'x-the-codegen-project-validation': 'required'
              },
              items: {
                type: 'array',
                'x-modelina-items': 'string',
                items: {
                  type: 'string'
                }
              }
            }
          },
          'x-the-codegen-project-version': '2.0.0'
        };

        const result = safeStringify(complex);
        const parsed = JSON.parse(result);
        
        expect(parsed.schema.type).toBe('object');
        expect(parsed.schema.properties.name.type).toBe('string');
        expect(parsed.schema.properties.items.type).toBe('array');
        expect(parsed.schema.properties.items.items.type).toBe('string');
        
        // Extension properties should be removed
        expect(parsed.schema['x-modelina-type']).toBeUndefined();
        expect(parsed.schema.properties.name['x-the-codegen-project-validation']).toBeUndefined();
        expect(parsed.schema.properties.items['x-modelina-items']).toBeUndefined();
        expect(parsed['x-the-codegen-project-version']).toBeUndefined();
      });
    });
  });
});
