
import * as generators from '../../src/codegen/generators';
import * as renderer from '../../src/codegen/renderer';
import { RunGeneratorContext } from '../../src/codegen/types';

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
