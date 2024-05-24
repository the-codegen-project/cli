/* eslint-disable sonarjs/no-duplicate-string */
 
import path from 'node:path';
import { expect, test } from '@oclif/test';
import {rimrafSync} from 'rimraf';
import { fileURLToPath } from 'node:url';
const generalOptions = ['generate'];
const dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_MJS = path.resolve(dirname, '../configs/config.js');

describe('generate', () => {
  test
    .stderr()
    .stdout()
    .command([...generalOptions, CONFIG_MJS])
    .it('should with basic configuration work', (ctx, done) => {
      expect(ctx.stderr).to.contain('');
      done();
    });
});
