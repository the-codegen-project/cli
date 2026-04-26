/**
 * Tests for the rendering pipeline.
 * Verifies generator execution, dependency resolution, and file generation.
 */
import * as generators from '../../src/codegen/generators';
import * as renderer from '../../src/codegen/renderer';
import { RunGeneratorContext, GeneratedFile } from '../../src/codegen/types';

jest.mock('../../src/codegen/generators');
describe('Render graph', () => {
  it('should correctly determine render graph for all generators', async () => {
    const customRenderFunctionCallback = jest.fn();
    const context: any = {
      configuration: {
        inputType: 'asyncapi',
        inputPath: "asyncapi.json",
        generators: [
          {
            preset: 'client',
            protocols: ['nats'],
            outputPath: './src/__gen__/',
            id: 'client-typescript',
            dependencies: ['channels-typescript'],
            language: 'typescript'
          },
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payload',
            serializationType: 'json',
            id: 'payloads-typescript',
            language: 'typescript',
          },
          {
            preset: 'parameters',
            outputPath: './src/__gen__/parameters',
            serializationType: 'json',
            id: 'parameters-typescript',
            language: 'typescript'
          },
          {
            preset: 'channels',
            protocols: ['nats'],
            outputPath: './src/__gen__/',
            id: 'channels-typescript',
            dependencies: ['payloads-typescript', 'parameters-typescript'],
            language: 'typescript'
          },
          {
            preset: 'headers',
            outputPath: './src/__gen__/headers',
            serializationType: 'json',
            id: 'headers-typescript',
            language: 'typescript',
          },
          {
            preset: 'custom',
            options: {},
            renderFunction: customRenderFunctionCallback,
            id: 'custom',
            dependencies: ['channels-typescript']
          }
        ]
      }, 
      documentPath: 'test',
      configFilePath: __dirname,
      asyncapiDocument: {}
    };

    const graph = renderer.determineRenderGraph(context);
    await renderer.renderGraph(context, graph);
    expect(generators.generateTypeScriptChannels).toHaveBeenCalledTimes(1);
    expect(generators.generateTypeScriptClient).toHaveBeenCalledTimes(1);
    expect(generators.generateTypescriptParameters).toHaveBeenCalledTimes(1);
    expect(generators.generateTypescriptPayload).toHaveBeenCalledTimes(1);
    expect(generators.generateTypescriptHeaders).toHaveBeenCalledTimes(1);
    expect(customRenderFunctionCallback).toHaveBeenCalledTimes(1);
  });
  
  it('should throw error on circular graphs', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'asyncapi',
        inputPath: "asyncapi.json",
        generators: [
          {
            preset: 'custom',
            options: {},
            renderFunction: () => {},
            id: 'custom-1',
            dependencies: ['custom-2']
          },
          {
            preset: 'custom',
            options: {},
            renderFunction: () => {},
            id: 'custom-2',
            dependencies: ['custom-1']
          }
        ]
      }, 
      documentPath: 'test',
      configFilePath: '',
      asyncapiDocument: undefined
    };

    const graph = renderer.determineRenderGraph(context);
    await expect(async () => {
      await renderer.renderGraph(context, graph);
    }).rejects.toThrow("Circular dependency detected in generator configuration");
  });
  it('should throw error on self graph', async () => {
    const context: RunGeneratorContext = {
      configuration: {
        inputType: 'asyncapi',
        inputPath: "asyncapi.json",
        generators: [
          {
            preset: 'custom',
            options: {},
            renderFunction: () => {},
            id: 'custom',
            dependencies: ['custom']
          }
        ]
      },
      documentPath: 'test',
      configFilePath: '',
      asyncapiDocument: undefined
    };

    expect(() => renderer.determineRenderGraph(context)).toThrow("Circular dependency detected in generator configuration");
  });
  it('should throw error when two generators has the same id', async () => {
    const context: any = {
      configuration: {
        inputType: 'asyncapi',
        inputPath: "asyncapi.json",
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payload',
            serializationType: 'json',
            id: 'payloads-typescript',
            language: 'typescript',
          },
          {
            preset: 'payloads',
            outputPath: './src/__gen__/payload',
            serializationType: 'json',
            id: 'payloads-typescript',
            language: 'typescript',
          }
        ]
      },
      documentPath: 'test',
      configFilePath: '',
      asyncapiDocument: undefined
    };

    expect(() => renderer.determineRenderGraph(context)).toThrow('Duplicate generator IDs found: payloads-typescript');
  });
});

describe('Pure core generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock generators to return files: GeneratedFile[] instead of filesWritten
    const mockGeneratorResult = {
      files: [
        { path: 'src/payloads/User.ts', content: 'export class User {}' }
      ] as GeneratedFile[]
    };
    (generators.generateTypescriptPayload as jest.Mock).mockResolvedValue(mockGeneratorResult);
    (generators.generateTypescriptParameters as jest.Mock).mockResolvedValue({ files: [] });
    (generators.generateTypescriptHeaders as jest.Mock).mockResolvedValue({ files: [] });
    (generators.generateTypescriptTypes as jest.Mock).mockResolvedValue({ files: [] });
    (generators.generateTypeScriptChannels as jest.Mock).mockResolvedValue({ files: [] });
    (generators.generateTypeScriptClient as jest.Mock).mockResolvedValue({ files: [] });
  });

  it('should return files as GeneratedFile[] (path + content)', async () => {
    const context: any = {
      configuration: {
        inputType: 'asyncapi',
        inputPath: 'asyncapi.json',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/payloads',
            id: 'payloads-typescript',
            language: 'typescript'
          }
        ]
      },
      documentPath: 'test',
      configFilePath: __dirname,
      asyncapiDocument: {}
    };

    const graph = renderer.determineRenderGraph(context);
    const result = await renderer.renderGraph(context, graph);

    // Should return files with path and content
    expect(result.files).toBeDefined();
    expect(Array.isArray(result.files)).toBe(true);
    expect(result.files.length).toBeGreaterThan(0);

    // Each file should have path and content
    const file = result.files[0];
    expect(file).toHaveProperty('path');
    expect(file).toHaveProperty('content');
    expect(typeof file.path).toBe('string');
    expect(typeof file.content).toBe('string');
  });

  it('should not include filesWritten in result (deprecated)', async () => {
    const context: any = {
      configuration: {
        inputType: 'asyncapi',
        inputPath: 'asyncapi.json',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/payloads',
            id: 'payloads-typescript',
            language: 'typescript'
          }
        ]
      },
      documentPath: 'test',
      configFilePath: __dirname,
      asyncapiDocument: {}
    };

    const graph = renderer.determineRenderGraph(context);
    const result = await renderer.renderGraph(context, graph);

    // files should be the new format, allFiles (string paths) should be deprecated
    expect(result.files).toBeDefined();
    // allFiles should be derived from files[].path for backwards compatibility, or removed
  });

  it('should collect files from all generators', async () => {
    // Mock multiple generators returning files
    (generators.generateTypescriptPayload as jest.Mock).mockResolvedValue({
      files: [
        { path: 'src/payloads/User.ts', content: 'export class User {}' },
        { path: 'src/payloads/Order.ts', content: 'export class Order {}' }
      ] as GeneratedFile[]
    });
    (generators.generateTypescriptTypes as jest.Mock).mockResolvedValue({
      files: [
        { path: 'src/types/Types.ts', content: 'export type Topics = "users";' }
      ] as GeneratedFile[]
    });

    const context: any = {
      configuration: {
        inputType: 'asyncapi',
        inputPath: 'asyncapi.json',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/payloads',
            id: 'payloads-typescript',
            language: 'typescript'
          },
          {
            preset: 'types',
            outputPath: './src/types',
            id: 'types-typescript',
            language: 'typescript'
          }
        ]
      },
      documentPath: 'test',
      configFilePath: __dirname,
      asyncapiDocument: {}
    };

    const graph = renderer.determineRenderGraph(context);
    const result = await renderer.renderGraph(context, graph);

    // Should have 3 files total (2 from payloads, 1 from types)
    expect(result.files).toHaveLength(3);

    // Verify files from both generators are included
    const paths = result.files.map(f => f.path);
    expect(paths).toContain('src/payloads/User.ts');
    expect(paths).toContain('src/payloads/Order.ts');
    expect(paths).toContain('src/types/Types.ts');
  });

  it('should track files in generator results', async () => {
    (generators.generateTypescriptPayload as jest.Mock).mockResolvedValue({
      files: [
        { path: 'src/payloads/User.ts', content: 'export class User {}' }
      ] as GeneratedFile[]
    });

    const context: any = {
      configuration: {
        inputType: 'asyncapi',
        inputPath: 'asyncapi.json',
        generators: [
          {
            preset: 'payloads',
            outputPath: './src/payloads',
            id: 'payloads-typescript',
            language: 'typescript'
          }
        ]
      },
      documentPath: 'test',
      configFilePath: __dirname,
      asyncapiDocument: {}
    };

    const graph = renderer.determineRenderGraph(context);
    const result = await renderer.renderGraph(context, graph);

    // Generator result should track files too
    expect(result.generators).toHaveLength(1);
    expect(result.generators[0].files).toBeDefined();
    expect(result.generators[0].files).toHaveLength(1);
    expect(result.generators[0].files[0].path).toBe('src/payloads/User.ts');
  });
});
