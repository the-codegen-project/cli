import {determineRenderGraph, renderGraph} from '../../src/codegen/render-graph';
import * as generators from '../../src/codegen/generators';
import { RunGeneratorContext } from '../../src/codegen/types';

jest.mock('../../src/codegen/generators', () => {
  return {
    __esModule: true,
    ...jest.requireActual('../../src/codegen/generators')
  };
});

describe('Render graph', () => {
  it('should correctly determine render graph for all generators', async () => {
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
            preset: 'custom',
            options: {},
            renderFunction: () => {},
            id: 'custom',
            dependencies: ['channels-typescript']
          }
        ]
      }, 
      documentPath: 'test',
      configFilePath: '',
      asyncapiDocument: undefined
    };

    const renderGeneratorSpy = jest.spyOn(generators, "renderGenerator");
    renderGeneratorSpy.mockResolvedValue(undefined);
    const graph = determineRenderGraph(context);
    await renderGraph(context, graph);
    expect(renderGeneratorSpy).toHaveBeenCalledTimes(context.configuration.generators.length);
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

    const renderGeneratorSpy = jest.spyOn(generators, "renderGenerator");
    renderGeneratorSpy.mockResolvedValue(undefined);
    const graph = determineRenderGraph(context);
    await expect(async () => {
      await renderGraph(context, graph);
    }).rejects.toThrow("You are not allowed to have circular dependencies in generators");
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

    const renderGeneratorSpy = jest.spyOn(generators, "renderGenerator");
    renderGeneratorSpy.mockResolvedValue(undefined);
    expect(() => determineRenderGraph(context)).toThrow("You are not allowed to have self dependant generators");
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

    const renderGeneratorSpy = jest.spyOn(generators, "renderGenerator");
    renderGeneratorSpy.mockResolvedValue(undefined);
    expect(() => determineRenderGraph(context)).toThrow('There are two or more generators that use the same id, please use unique id\'s for each generator, id(\'s) are payloads-typescript');
  });
});
