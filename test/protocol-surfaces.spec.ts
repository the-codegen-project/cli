/**
 * Guards the hand-maintained protocol lists that live *outside* the generator.
 *
 * Adding a `channels` protocol touches the Zod enum and the renderer, and it is
 * easy to stop there — but the CLI wizard, the website playground and the MCP
 * server each keep their own copy of the protocol list, none of which is
 * generated from the Zod schema. Nothing else in CI reads them, so a new
 * protocol silently ships missing from every one of those surfaces. (That is
 * exactly what happened when `http_server` was added.)
 *
 * The Zod enum is the source of truth here. When this fails, the message names
 * the file and the literal to add - do that rather than editing the expectation.
 */
import fs from 'node:fs';
import path from 'node:path';
import {zodTypescriptChannelsGenerator} from '../src/codegen/generators/typescript/channels/types';
import {ChannelProtocolOptions} from '../src/commands/init';

const repoRoot = path.resolve(__dirname, '..');

/**
 * The protocols the `channels` generator accepts, read off the Zod schema so
 * this list cannot drift from the one the generator actually validates against.
 */
const protocols: string[] = (
  zodTypescriptChannelsGenerator.shape.protocols as any
)._def.innerType._def.type._def.values;

/**
 * Docs pages are not always named after the protocol value - `event_source`
 * lives at `protocols/eventsource.md`. Map the exceptions.
 */
const docsSlugs: Record<string, string> = {
  event_source: 'eventsource'
};
const docsSlug = (protocol: string): string =>
  docsSlugs[protocol] ?? protocol;

/**
 * Each surface says how a protocol is spelled in it, so the failure message can
 * quote the exact text that is missing.
 */
const surfaces: {
  file: string;
  what: string;
  needle: (protocol: string) => string;
}[] = [
  {
    file: 'website/src/components/Playground/ConfigForm.tsx',
    what: 'the playground protocol picker (PROTOCOLS)',
    needle: (protocol) => `value: '${protocol}'`
  },
  {
    file: 'website/src/utils/configCodegen.ts',
    what: 'the playground input-type filter (PROTOCOL_INPUT_COMPATIBILITY) - the picker hides anything missing here',
    needle: (protocol) => `${protocol}:`
  },
  {
    file: 'website/src/components/Home/Protocols/index.tsx',
    what: 'the homepage protocol marquee',
    needle: (protocol) => `/docs/protocols/${docsSlug(protocol)}`
  },
  {
    file: 'website/src/components/Home/demos.ts',
    what: 'the homepage "spec in -> code out" showcase. Generate the snippet from the demo\'s own spec with the real CLI - see that file\'s header comment; nothing there may be written from memory',
    needle: (protocol) => `path: 'src/__gen__/${protocol}.ts'`
  },
  {
    file: 'docs/generators/channels.md',
    what: 'the supported-protocols line of the channels generator docs',
    needle: (protocol) => `\`${protocol}\``
  },
  {
    file: 'docs/README.md',
    what: 'the protocol index',
    needle: (protocol) => `./protocols/${docsSlug(protocol)}.md`
  }
];

describe('protocol surfaces stay in sync with the channels Zod enum', () => {
  it('reads a non-empty protocol list off the Zod schema', () => {
    // If the schema shape changes, every other assertion here would silently
    // pass against an empty list.
    expect(protocols.length).toBeGreaterThan(0);
    expect(protocols).toContain('nats');
  });

  it('offers every protocol in the `codegen init` wizard', () => {
    expect([...ChannelProtocolOptions].sort()).toEqual([...protocols].sort());
  });

  it('lists every protocol in the MCP `protocolValues` constant', () => {
    // mcp-server is a separate package that the root tsconfig does not build,
    // so read the constant out of the source rather than importing it.
    const source = fs.readFileSync(
      path.join(repoRoot, 'mcp-server/lib/data/generators.ts'),
      'utf8'
    );
    const declaration = /export const protocolValues = \[([^\]]*)\] as const;/.exec(
      source
    );
    expect(
      declaration
        ? null
        : 'Could not find `export const protocolValues = [...] as const;` in ' +
          'mcp-server/lib/data/generators.ts. It is the single source for every ' +
          'MCP tool schema - if it was renamed, update this test to match.'
    ).toBeNull();
    const declared = ((declaration as RegExpExecArray)[1].match(/'[^']+'/g) ?? []).map(
      (value) => value.slice(1, -1)
    );
    expect(declared.sort()).toEqual([...protocols].sort());
  });

  it.each([
    'mcp-server/lib/tools/config-tools.ts',
    'mcp-server/lib/tools/integration-tools.ts',
    'mcp-server/app/api/mcp/route.ts'
  ])('builds the protocol z.enum in %s from protocolValues', (file) => {
    // These three used to inline their own seven-protocol enum and were missed
    // when `http_server` was added, so the MCP tools rejected it. Deriving from
    // protocolValues is what keeps them correct - re-inlining a list here would
    // reintroduce exactly that bug.
    const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
    const complaint = source.includes('protocolValues')
      ? null
      : `${file} no longer references protocolValues. Its protocol z.enum must ` +
        'be built from that constant (mcp-server/lib/data/generators.ts) ' +
        'rather than an inline list, or it will drift when a protocol is added.';
    expect(complaint).toBeNull();
  });

  describe.each(protocols)('%s', (protocol) => {
    it.each(surfaces)('is listed in $file', ({file, what, needle}) => {
      const contents = fs.readFileSync(path.join(repoRoot, file), 'utf8');
      const expected = needle(protocol);
      const complaint = contents.includes(expected)
        ? null
        : `'${protocol}' is missing from ${file} - ${what}.\n` +
          `Expected to find ${JSON.stringify(expected)} in that file.`;
      expect(complaint).toBeNull();
    });

    it('has a documentation page', () => {
      const page = `docs/protocols/${docsSlug(protocol)}.md`;
      const complaint = fs.existsSync(path.join(repoRoot, page))
        ? null
        : `'${protocol}' has no docs page at ${page}.\n` +
          'Add one (or add an entry to docsSlugs in this test if it is named differently).';
      expect(complaint).toBeNull();
    });
  });
});
