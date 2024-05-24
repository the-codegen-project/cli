import path from 'node:path';
import { expect } from '@oclif/test';
import { fileURLToPath } from 'url';
const dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_MJS = path.resolve(dirname, '../configs/config.js');
import {loadConfigFile} from '../../src/codegen/configuration-manager.js'

describe('configuration manager', () => {
  describe('ESM', () => {    
    it('should work with correct ESM config', async () => {
      const config = await loadConfigFile({
        configPath: CONFIG_MJS,
        configType: 'esm'
      });
      expect(config.inputType).to.equal('asyncapi');
    });
  });
});
