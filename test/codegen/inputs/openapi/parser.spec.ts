import path from 'path';
import {loadOpenapi} from '../../../../src/codegen/inputs/openapi';
import {RunGeneratorContext} from '../../../../src/codegen/types';
import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

describe('OpenAPI Input Parser', () => {
  it('should load and parse OpenAPI 3.0 document', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'openapi',
        inputPath: 'openapi-3.json',
        generators: []
      },
      configFilePath: path.resolve(__dirname, '../../../configs/config.json'),
      documentPath: path.resolve(__dirname, '../../../configs/openapi-3.json'),
    };

    const document = await loadOpenapi(context) as OpenAPIV3.Document;
    
    expect(document).toBeDefined();
    expect(document.openapi).toBeDefined();
    expect(document.info).toBeDefined();
    expect(document.info.title).toBe('OpenAPI Petstore');
    expect(document.info.version).toBe('1.0.0');
    expect(document.paths).toBeDefined();
    expect(Object.keys(document.paths).length).toBeGreaterThan(0);
  });
  it('should load and parse OpenAPI 3.1 document', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'openapi',
        inputPath: 'openapi-3_1.json',
        generators: []
      },
      configFilePath: path.resolve(__dirname, '../../../configs/config.json'),
      documentPath: path.resolve(__dirname, '../../../configs/openapi-3_1.json'),
    };

    const document = await loadOpenapi(context) as OpenAPIV3_1.Document;
    
    expect(document).toBeDefined();
    expect(document.openapi).toBeDefined();
    expect(document.info).toBeDefined();
    expect(document.info.title).toBe('OpenAPI Petstore');
    expect(document.info.version).toBe('1.0.0');
    expect(document.paths).toBeDefined();
    expect(Object.keys(document.paths ?? {}).length).toBeGreaterThan(0);
  });
  it('should load and parse OpenAPI 2.0 document', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'openapi',
        inputPath: 'openapi-2.json',
        generators: []
      },
      configFilePath: path.resolve(__dirname, '../../../configs/config.json'),
      documentPath: path.resolve(__dirname, '../../../configs/openapi-2.json'),
    };

    const document = await loadOpenapi(context) as OpenAPIV2.Document;
    
    expect(document).toBeDefined();
    expect(document.swagger).toBeDefined();
    expect(document.info).toBeDefined();
    expect(document.info.title).toBe('Swagger Petstore');
    expect(document.info.version).toBe('1.0.7');
    expect(document.paths).toBeDefined();
    expect(Object.keys(document.paths).length).toBeGreaterThan(0);
  });

  it('should handle invalid OpenAPI document', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'openapi',
        inputPath: 'invalid.yaml',
        generators: []
      },
      configFilePath: path.resolve(__dirname, '../../../configs/config.json'),
      documentPath: path.resolve(__dirname, 'non-existent-file.yaml'),
    };

    await expect(loadOpenapi(context)).rejects.toThrow();
  });
}); 
