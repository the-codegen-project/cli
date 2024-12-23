import { runCommand } from '@oclif/test';

describe('init', () => {
  it('should generate esm configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
  it('should generate typescript configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`init --config-type=ts --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
  it('should generate json configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`init --config-type=json --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
  it('should generate yaml configuration', async () => {
    const {stdout, stderr, error} = await runCommand(`init --config-type=yaml --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
  it('should generate configuration with headers', async () => {
    const {stdout, stderr, error} = await runCommand(`init --config-type=esm --input-file='./asyncapi.json' --input-type=asyncapi --languages=typescript --no-tty --output-directory='./' --no-output --include-headers`);
    expect(error).toBeUndefined();
    expect(stderr).toEqual('');
    expect(stdout).not.toEqual('');
  });
});
