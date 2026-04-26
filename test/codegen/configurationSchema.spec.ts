import {zodToJsonSchema} from 'zod-to-json-schema';
import {
  postProcessClean,
  postProcessMarkdown
} from '../../src/codegen/schemaPostProcess';
import {
  zodTheCodegenConfiguration,
  zodAsyncAPICodegenConfiguration
} from '../../src/codegen/types';

const buildSchema = (postProcess: any): any =>
  zodToJsonSchema(zodTheCodegenConfiguration, {
    definitions: {AsyncAPICodegenConfiguration: zodAsyncAPICodegenConfiguration},
    postProcess
  });

const walkDescriptions = (
  node: any,
  fn: (d: string, key: string) => void
): void => {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (typeof node.description === 'string') {
    fn(node.description, 'description');
  }
  if (typeof node.markdownDescription === 'string') {
    fn(node.markdownDescription, 'markdownDescription');
  }
  for (const v of Object.values(node)) {
    walkDescriptions(v, fn);
  }
};

describe('configuration schema generation', () => {
  it('clean variant has no markdown link wrappers in any description', () => {
    const clean = buildSchema(postProcessClean);
    let found = false;
    walkDescriptions(clean, (d, k) => {
      if (k === 'description' && (/\[[^\]]+\]\(https?:\/\//).test(d)) {
        found = true;
      }
    });
    expect(found).toBe(false);
  });

  it('clean variant has no markdownDescription keys', () => {
    const clean = buildSchema(postProcessClean);
    let found = false;
    walkDescriptions(clean, (_, k) => {
      if (k === 'markdownDescription') {
        found = true;
      }
    });
    expect(found).toBe(false);
  });

  it('markdown variant has at least one markdownDescription with a docs link', () => {
    const md = buildSchema(postProcessMarkdown);
    let count = 0;
    walkDescriptions(md, (d, k) => {
      if (
        k === 'markdownDescription' &&
        d.includes('https://the-codegen-project.org/docs/')
      ) {
        count++;
      }
    });
    expect(count).toBeGreaterThan(0);
  });

  it('markdown variant has no plain description keys (all converted)', () => {
    const md = buildSchema(postProcessMarkdown);
    let found = false;
    walkDescriptions(md, (_, k) => {
      if (k === 'description') {
        found = true;
      }
    });
    expect(found).toBe(false);
  });
});
