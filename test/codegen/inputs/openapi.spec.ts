import path from 'path';
import {writeFileSync, unlinkSync} from 'fs';
import {loadOpenapi} from '../../../src/codegen/inputs/openapi';
import {RunGeneratorContext} from '../../../src/codegen/types';

describe('OpenAPI Input Parser', () => {
  it('should load and parse OpenAPI 3.0 document', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'openapi',
        inputPath: 'openapi.yaml',
        generators: []
      },
      configFilePath: path.resolve(__dirname, '../../configs/config.json'),
      documentPath: path.resolve(__dirname, '../../configs/openapi.yaml'),
    };

    const document = await loadOpenapi(context);
    
    expect(document).toBeDefined();
    expect(document.openapi).toBeDefined();
    expect(document.info).toBeDefined();
    expect(document.info.title).toBe('OpenAPI Petstore');
    expect(document.info.version).toBe('1.0.0');
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
      configFilePath: path.resolve(__dirname, '../../configs/config.json'),
      documentPath: path.resolve(__dirname, 'non-existent-file.yaml'),
    };

    await expect(loadOpenapi(context)).rejects.toThrow();
  });

  it('should handle JSON OpenAPI documents', async () => {
    // Create a simple valid OpenAPI document in memory for testing
    const validOpenAPIContent = JSON.stringify({
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0'
      },
      paths: {}
    });

    // Write to a temporary file for testing
    const tempPath = path.resolve(__dirname, 'temp-openapi.json');
    writeFileSync(tempPath, validOpenAPIContent);

    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'openapi',
        inputPath: 'temp-openapi.json',
        generators: []
      },
      configFilePath: path.resolve(__dirname, '../../configs/config.json'),
      documentPath: tempPath,
    };

    try {
      const document = await loadOpenapi(context);
      
      expect(document).toBeDefined();
      expect(document.openapi).toBe('3.0.0');
      expect(document.info.title).toBe('Test API');
    } finally {
      // Clean up
      unlinkSync(tempPath);
    }
  });
}); 
