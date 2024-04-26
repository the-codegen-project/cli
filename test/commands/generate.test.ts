 
/* eslint-disable sonarjs/no-duplicate-string */
 
import path from 'node:path';
import { expect, test } from '@oclif/test';
import {rimrafSync} from 'rimraf';
const generalOptions = ['generate'];
const outputDir = './test/fixtures/generate/models';
const ASYNCAPI_V2_DOCUMENT = path.resolve(import.meta.url, '../fixtures/asyncapi_v2.yml')
const ASYNCAPI_V3_DOCUMENT = path.resolve(import.meta.url, '../fixtures/asyncapi_v3.yml')

describe('models', () => {
  after(() => {
    rimrafSync(outputDir);
  });

  test
    .stderr()
    .stdout()
    .command([...generalOptions, 'random', ASYNCAPI_V2_DOCUMENT, `-o=${ path.resolve(outputDir, './random')}`])
    .it('fails when it dont know the language', (ctx, done) => {
      expect(ctx.stderr).to.contain('Error: Expected random to be one of: typescript, csharp, golang, java, javascript, dart, python, rust, kotlin, php, cplusplus, scala\nSee more help with --help\n');
      done();
    });
});
