import {zodToJsonSchema} from 'zod-to-json-schema';
import {
  postProcessClean,
  postProcessMarkdown
} from '../../src/codegen/schemaPostProcess';
import {
  zodTheCodegenConfiguration,
  zodAsyncAPICodegenConfiguration
} from '../../src/codegen/types';
import {buildConfigurationSchema} from '../../src/codegen/configurationSchemaBuilder';

const buildSchema = (postProcess: any): any =>
  zodToJsonSchema(zodTheCodegenConfiguration, {
    definitions: {AsyncAPICodegenConfiguration: zodAsyncAPICodegenConfiguration},
    postProcess
  });

function collectRefs(
  node: any,
  path: string[] = [],
  out: Array<{ref: string; path: string[]}> = []
): Array<{ref: string; path: string[]}> {
  if (!node || typeof node !== 'object') {
    return out;
  }
  if (typeof node.$ref === 'string') {
    out.push({ref: node.$ref, path: [...path]});
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectRefs(v, [...path, String(i)], out));
  } else {
    for (const [k, v] of Object.entries(node)) {
      collectRefs(v, [...path, k], out);
    }
  }
  return out;
}

function resolvePointer(root: any, ref: string): unknown {
  if (!ref.startsWith('#/')) {
    throw new Error(`unsupported ref: ${ref}`);
  }
  return ref
    .slice(2)
    .split('/')
    .reduce(
      (acc: any, seg) =>
        acc === null || acc === undefined
          ? acc
          : acc[seg.replace(/~1/g, '/').replace(/~0/g, '~')],
      root
    );
}

function resolveIfRef(schema: any, node: any): any {
  return typeof node?.$ref === 'string'
    ? resolvePointer(schema, node.$ref)
    : node;
}

function collectGeneratorPresets(schema: any): unknown[] {
  const presets: unknown[] = [];
  for (const branch of schema.anyOf ?? []) {
    const target = resolveIfRef(schema, branch);
    const entries: any[] = target?.properties?.generators?.items?.anyOf ?? [];
    for (const entry of entries) {
      const resolved = resolveIfRef(schema, entry);
      presets.push(resolved?.properties?.preset?.const);
    }
  }
  return presets;
}

function findUnresolvedRefs(
  schema: any
): Array<{ref: string; path: string[]}> {
  return collectRefs(schema).filter(
    ({ref}) => resolvePointer(schema, ref) === undefined
  );
}

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

describe('buildConfigurationSchema', () => {
  it.each([
    ['clean', postProcessClean],
    ['markdown', postProcessMarkdown]
  ])('%s: every $ref resolves to an existing JSON Pointer target', (_, pp) => {
    const schema = buildConfigurationSchema(pp);
    expect(collectRefs(schema).length).toBeGreaterThan(0);
    expect(findUnresolvedRefs(schema)).toEqual([]);
  });

  it('removes the custom preset from AsyncAPI, OpenAPI, and JSON Schema generator unions', () => {
    const schema = buildConfigurationSchema(postProcessClean);
    expect(collectGeneratorPresets(schema)).not.toContain('custom');
  });

  it('handles a multi-element disabledPresets list without dangling refs', () => {
    // Index renumbering after removing a non-last preset is intentionally out
    // of scope (see configurationSchemaBuilder.ts). To still exercise the
    // multi-element predicate path (and guard against the original
    // String.prototype.includes(array) bug), pair 'custom' with a sentinel
    // that doesn't match any preset — both elements are iterated, but only
    // the last index in each union is removed, so refs stay valid.
    const schema = buildConfigurationSchema(postProcessClean, [
      'custom',
      '__nonexistent_preset_for_test__'
    ]);
    expect(findUnresolvedRefs(schema)).toEqual([]);
    expect(collectGeneratorPresets(schema)).not.toContain('custom');
  });
});
