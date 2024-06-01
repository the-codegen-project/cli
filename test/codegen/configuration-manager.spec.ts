import path from 'path';
const CONFIG_MJS = path.resolve(__dirname, '../configs/config.js');
import {loadConfigFile} from '../../src/codegen/configuration-manager.ts';

describe('configuration manager', () => {
  describe('ESM', () => {
    it('should work with correct ESM config', async () => {
      const config = await loadConfigFile({
        configPath: CONFIG_MJS,
        configType: 'esm'
      });
      expect(config.inputType).toEqual('asyncapi');
    });
  });
});
