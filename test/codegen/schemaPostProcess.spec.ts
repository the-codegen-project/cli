import {
  stripMarkdownLinks,
  postProcessClean,
  postProcessMarkdown
} from '../../src/codegen/schemaPostProcess';

describe('stripMarkdownLinks', () => {
  it('replaces a single markdown link with its link text', () => {
    expect(
      stripMarkdownLinks('See [the docs](https://example.com/docs)')
    ).toBe('See the docs');
  });

  it('handles multiple links in one string', () => {
    expect(
      stripMarkdownLinks('A [one](https://a.example) and [two](https://b.example).')
    ).toBe('A one and two.');
  });

  it('leaves plain text untouched', () => {
    expect(stripMarkdownLinks('No links here')).toBe('No links here');
  });

  it('only strips http(s) links (not arbitrary brackets)', () => {
    expect(stripMarkdownLinks('Array of [string]')).toBe('Array of [string]');
  });
});

describe('postProcessClean', () => {
  it('strips link wrappers from description', () => {
    const out: any = {description: 'Hi [docs](https://x.dev)'};
    const result: any = postProcessClean(out, {} as any, {} as any);
    expect(result.description).toBe('Hi docs');
  });

  it('returns the input unchanged when there is no description', () => {
    const out: any = {type: 'string'};
    expect(postProcessClean(out, {} as any, {} as any)).toEqual({
      type: 'string'
    });
  });

  it('does not introduce markdownDescription', () => {
    const out: any = {description: 'Hi [docs](https://x.dev)'};
    const result: any = postProcessClean(out, {} as any, {} as any);
    expect(result.markdownDescription).toBeUndefined();
  });
});

describe('postProcessMarkdown', () => {
  it('renames description to markdownDescription', () => {
    const out: any = {description: 'Hi [docs](https://x.dev)'};
    const result: any = postProcessMarkdown(out, {} as any, {} as any);
    expect(result.markdownDescription).toBe('Hi [docs](https://x.dev)');
    expect(result.description).toBeUndefined();
  });

  it('is a no-op when there is no description', () => {
    expect(postProcessMarkdown({type: 'string'} as any, {} as any, {} as any)).toEqual({
      type: 'string'
    });
  });
});
