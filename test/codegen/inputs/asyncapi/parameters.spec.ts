import {processAsyncAPIParameters} from '../../../../src/codegen/inputs/asyncapi/generators/parameters';
import {loadAsyncapiFromMemory} from '../../../../src/codegen/inputs/asyncapi';
import {generateModels} from '../../../../src/codegen/output';
import {TypeScriptFileGenerator} from '@asyncapi/modelina';

// Only AsyncAPI v2 Parameter Objects carry a `schema`, so only a v2 document can
// reach a component pointer through the parameters path at all.
const recursiveParameterDocument = `asyncapi: 2.6.0
info:
  title: T
  version: 1.0.0
channels:
  'user/{id}':
    parameters:
      id:
        schema:
          $ref: '#/components/schemas/RecursiveId'
    publish:
      message:
        payload:
          type: object
          properties:
            value:
              type: string
components:
  schemas:
    RecursiveId:
      type: object
      properties:
        name:
          type: string
        parent:
          $ref: '#/components/schemas/RecursiveId'
`;

const plainParameterDocument = `asyncapi: 2.6.0
info:
  title: T
  version: 1.0.0
channels:
  'user/{id}':
    parameters:
      id:
        schema:
          type: string
    publish:
      message:
        payload:
          type: object
          properties:
            value:
              type: string
`;

/** Every `$ref` string anywhere in a fragment. */
const collectRefs = (node: any): string[] => {
  if (Array.isArray(node)) {
    return node.flatMap((entry) => collectRefs(entry));
  }
  if (node === null || typeof node !== 'object') {
    return [];
  }
  return Object.entries(node).flatMap(([key, value]) =>
    key === '$ref' && typeof value === 'string' ? [value] : collectRefs(value)
  );
};

describe('processAsyncAPIParameters recursive schemas', () => {
  it('rewrites a recursive parameter pointer to the inlined parameter property', async () => {
    const document = await loadAsyncapiFromMemory({
      input: recursiveParameterDocument
    });
    const processed = await processAsyncAPIParameters(document as any);
    const {schema} = processed.channelParameters['user/{id}'];

    expect(collectRefs(schema)).toEqual(['#/properties/id']);
    expect(schema).not.toHaveProperty('definitions');
    expect(schema).toMatchSnapshot();
  });

  it('generates models for a recursive parameter without duplicates', async () => {
    const document = await loadAsyncapiFromMemory({
      input: recursiveParameterDocument
    });
    const processed = await processAsyncAPIParameters(document as any);
    const result = await generateModels({
      generator: new TypeScriptFileGenerator(),
      input: processed.channelParameters['user/{id}'].schema,
      outputPath: 'src/parameters'
    });
    const modelNames = result.files.map((file) =>
      file.path.replace('src/parameters/', '').replace(/\.ts$/, '')
    );

    expect(modelNames.length).toBeGreaterThan(0);
    expect(new Set(modelNames).size).toEqual(modelNames.length);
  });

  it('leaves a non-recursive parameter fragment untouched', async () => {
    const document = await loadAsyncapiFromMemory({
      input: plainParameterDocument
    });
    const processed = await processAsyncAPIParameters(document as any);
    const {schema} = processed.channelParameters['user/{id}'];

    expect(collectRefs(schema)).toEqual([]);
    expect(schema).not.toHaveProperty('definitions');
    expect(schema.properties.id.type).toEqual('string');
  });
});
