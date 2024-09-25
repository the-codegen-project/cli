import { runCommand } from '@oclif/test';

describe('init', () => {
  it('should generate esm configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file-path='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
  it('should generate typescript configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`init --config-type=ts --input-file-path='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
  it('should generate json configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file-path='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
  it('should generate yaml configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`init --config-type=yaml --input-file-path='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
});
