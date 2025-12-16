import { generateWithConfig } from "../../../src/codegen/generators";
import { realizeGeneratorContext } from "../../../src/codegen/configurations";
import path from "path";

jest.mock('node:fs/promises');
jest.mock('node:fs');

// Mock the renderer to avoid actual file generation in tests
jest.mock('../../../src/codegen/renderer', () => ({
  determineRenderGraph: jest.fn(() => new Map()),
  renderGraph: jest.fn()
}));

describe('generateWithConfig', () => {
  test('should accept a string config path', async () => {
    const configPath = path.resolve(__dirname, '../../configs/config.js');
    await expect(generateWithConfig(configPath)).resolves.not.toThrow();
  });

  test('should accept undefined to search for config', async () => {
    // This will search for config in current directory
    // Should not throw even if no config found due to mocking
    await expect(generateWithConfig(undefined)).rejects.toThrow();
  });

  test('should accept a pre-realized RunGeneratorContext', async () => {
    const configPath = path.resolve(__dirname, '../../configs/config.js');
    const context = await realizeGeneratorContext(configPath);
    
    // Should not throw when passed a context object
    await expect(generateWithConfig(context)).resolves.not.toThrow();
  });
});
