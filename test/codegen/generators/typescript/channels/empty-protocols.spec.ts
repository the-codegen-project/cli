import path from 'node:path';
import {
  defaultTypeScriptChannelsGenerator,
  generateTypeScriptChannels
} from '../../../../../src/codegen/generators';
import {loadAsyncapiDocument} from '../../../../../src/codegen/inputs/asyncapi';
import {Logger} from '../../../../../src/LoggingInterface';

describe('channels empty protocols warning', () => {
  it('warns and still emits the barrel when no protocol functions are generated', async () => {
    const warnSpy = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
    try {
      const parsedAsyncAPIDocument = await loadAsyncapiDocument(
        path.resolve(__dirname, '../../../../configs/asyncapi.yaml')
      );
      const generated = await generateTypeScriptChannels({
        generator: {
          ...defaultTypeScriptChannelsGenerator,
          outputPath: path.resolve(__dirname, './output-empty-protocols'),
          id: 'test-empty-protocols',
          protocols: []
        },
        inputType: 'asyncapi',
        asyncapiDocument: parsedAsyncAPIDocument,
        dependencyOutputs: {
          'parameters-typescript': {
            channelModels: {},
            generator: {outputPath: './test'} as any,
            files: []
          },
          'payloads-typescript': {
            channelModels: {},
            operationModels: {},
            otherModels: [],
            generator: {outputPath: './test'} as any,
            files: []
          },
          'headers-typescript': {
            channelModels: {},
            generator: {outputPath: './test'} as any,
            files: []
          }
        }
      } as any);

      // The barrel (index.ts) must still be emitted — the content contract is unchanged.
      expect(generated.files.some((file) => file.path.endsWith('index.ts'))).toBe(
        true
      );

      // A warning must name the generator id and explain that nothing was generated.
      expect(warnSpy).toHaveBeenCalled();
      const warned = warnSpy.mock.calls.map((call) => String(call[0])).join('\n');
      expect(warned).toContain('test-empty-protocols');
      expect(warned).toMatch(/protocol/i);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
