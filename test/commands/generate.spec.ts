import path from 'node:path';
import { runCommand } from '@oclif/test';
import { fileURLToPath } from 'node:url';
const generalOptions = ['generate'];
const dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_MJS = path.resolve(dirname, '../configs/config.js');

describe('generate', () => {
  it('shows user email when logged in', async () => {
    const {stdout} = await runCommand('whoami');
    expect(stdout).toEqual('jeff@example.com');
  });
});
