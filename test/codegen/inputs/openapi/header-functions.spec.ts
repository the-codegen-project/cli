import path from 'node:path';
import {loadOpenapiDocument} from '../../../../src/codegen/inputs/openapi';
import {generateTypescriptHeaders} from '../../../../src/codegen/generators/typescript/headers';

/**
 * Drives the whole headers generator with a purpose-built OpenAPI document
 * rather than hand-building `ConstrainedObjectModel`s — the constrained naming
 * (`X-Request-ID` -> `xMinusRequestMinusId`) is exactly what the deserializer
 * has to invert, so exercising the real pipeline is far less brittle.
 */
async function generateHeaderFile(): Promise<{
  content: string;
  headerFunctions: Record<string, string[]>;
}> {
  const openapiDocument = await loadOpenapiDocument({
    documentPath: path.resolve(
      __dirname,
      '../../../configs/openapi-header-types.json'
    )
  });

  const rendered = await generateTypescriptHeaders({
    generator: {
      outputPath: path.resolve(__dirname, './output'),
      preset: 'headers',
      language: 'typescript',
      dependencies: [],
      serializationType: 'json',
      includeValidation: true,
      id: 'test'
    },
    inputType: 'openapi',
    openapiDocument,
    dependencyOutputs: {}
  });

  const file = rendered.files.find((candidate) =>
    candidate.path.endsWith('ListThingsHeaders.ts')
  );
  if (!file) {
    throw new Error('Expected a ListThingsHeaders.ts file to be generated');
  }
  return {
    content: file.content,
    headerFunctions: rendered.headerFunctions ?? {}
  };
}

describe('OpenAPI header functions', () => {
  it('should emit both a serializer and a deserializer', async () => {
    const {content} = await generateHeaderFile();

    expect(content).toContain(
      'export function serializeListThingsHeadersHeaders'
    );
    expect(content).toContain(
      'export function deserializeListThingsHeadersHeaders'
    );
  });

  it('should map wire names back to their TypeScript property names', async () => {
    const {content} = await generateHeaderFile();
    const deserializer = content.slice(
      content.indexOf('export function deserializeListThingsHeadersHeaders')
    );

    // The serializer maps TS name -> wire name...
    expect(content).toContain(
      "result['X-Request-ID'] = String(headers.xMinusRequestMinusId)"
    );
    // ...and the deserializer is its exact inverse. It matches on the
    // lower-cased wire name so Express' `x-request-id` is found too.
    expect(deserializer).toContain('name.toLowerCase()');
    expect(deserializer).toContain("readHeader('x-request-id')");
    expect(deserializer).toContain('result.xMinusRequestMinusId =');
  });

  it('should coerce each header type back from its string wire form', async () => {
    const {content} = await generateHeaderFile();
    const deserializer = content.slice(
      content.indexOf('export function deserializeListThingsHeadersHeaders')
    );

    // number/integer
    expect(deserializer).toContain('Number(');
    expect(deserializer).toContain('Number.isNaN');
    // boolean
    expect(deserializer).toContain("=== 'true'");
    // array
    expect(deserializer).toContain(".split(',')");
  });

  it('should leave an absent header absent rather than assigning undefined', async () => {
    const {content} = await generateHeaderFile();
    const deserializer = content.slice(
      content.indexOf('export function deserializeListThingsHeadersHeaders')
    );

    // Every assignment must sit behind a presence check.
    const assignments = deserializer.match(/result\.[a-zA-Z]+ = /g) ?? [];
    expect(assignments.length).toBeGreaterThan(0);
    expect(deserializer).toContain('!== undefined');
  });

  it('should register both function names for the model', async () => {
    const {headerFunctions} = await generateHeaderFile();

    expect(headerFunctions['ListThingsHeaders']).toEqual([
      'serializeListThingsHeadersHeaders',
      'deserializeListThingsHeadersHeaders'
    ]);
  });

  it('should match the snapshot of the generated header functions', async () => {
    const {content} = await generateHeaderFile();

    expect(
      content.slice(
        content.indexOf('export function serializeListThingsHeadersHeaders')
      )
    ).toMatchSnapshot();
  });
});
