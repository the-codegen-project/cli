/**
 * Tests for how channel header models are referenced in generated code.
 *
 * A channel whose messages each declare their own headers produces a `oneOf`
 * union model. Its `type` is the expanded union (`A | B | C`) — referencing it
 * directly emits identifiers the generated file never imports, and there is no
 * static `unmarshal` on a type alias for the receive paths to call. Union
 * header models are therefore imported as a namespace, the same way payload
 * unions are.
 */
import {
  addHeadersToDependencies,
  getHeaderTypeAndModule
} from '../../../../../src/codegen/generators/typescript/channels/utils';
import {
  ConstrainedObjectModel,
  ConstrainedUnionModel,
  OutputModel
} from '@asyncapi/modelina';

const objectHeaders = new ConstrainedObjectModel(
  'UserSignedUpHeaders',
  undefined,
  {},
  'UserSignedUpHeaders',
  {}
);

const unionHeaders = new ConstrainedUnionModel(
  'OrderLifecycleHeaders',
  undefined,
  {},
  'OrderCreatedHeaders | OrderUpdatedHeaders | OrderCancelledHeaders',
  [
    new ConstrainedObjectModel(
      'OrderCreatedHeaders',
      undefined,
      {},
      'OrderCreatedHeaders',
      {}
    ),
    new ConstrainedObjectModel(
      'OrderUpdatedHeaders',
      undefined,
      {},
      'OrderUpdatedHeaders',
      {}
    )
  ]
);

const asOutputModel = (model: ConstrainedObjectModel | ConstrainedUnionModel) =>
  new OutputModel(
    '',
    model,
    model.name,
    {models: {}, originalInput: undefined},
    []
  );

describe('getHeaderTypeAndModule', () => {
  it('returns undefined for a channel without headers', () => {
    expect(getHeaderTypeAndModule(undefined)).toEqual({
      headerType: undefined,
      headerModule: undefined
    });
  });

  it('uses the model type directly for a single-message header model', () => {
    expect(getHeaderTypeAndModule(objectHeaders)).toEqual({
      headerType: 'UserSignedUpHeaders',
      headerModule: undefined
    });
  });

  it('routes a union header model through its namespace module', () => {
    // Not the expanded `A | B | C` — those members are never imported, and the
    // runtime helpers live on the module.
    expect(getHeaderTypeAndModule(unionHeaders)).toEqual({
      headerType: 'OrderLifecycleHeadersModule.OrderLifecycleHeaders',
      headerModule: 'OrderLifecycleHeadersModule'
    });
  });
});

describe('addHeadersToDependencies', () => {
  const headerGenerator = {outputPath: './src/__gen__/channels/headers'};
  const currentGenerator = {outputPath: './src/__gen__/channels'};

  it('emits a named import for a single-message header model', () => {
    const dependencies: string[] = [];

    addHeadersToDependencies(
      {channel: asOutputModel(objectHeaders)},
      headerGenerator,
      currentGenerator,
      dependencies
    );

    expect(dependencies).toEqual([
      `import {UserSignedUpHeaders} from './headers/UserSignedUpHeaders';`
    ]);
  });

  it('emits a namespace import for a union header model', () => {
    const dependencies: string[] = [];

    addHeadersToDependencies(
      {channel: asOutputModel(unionHeaders)},
      headerGenerator,
      currentGenerator,
      dependencies
    );

    expect(dependencies).toEqual([
      `import * as OrderLifecycleHeadersModule from './headers/OrderLifecycleHeaders';`
    ]);
  });

  it('applies the import extension to the namespace import', () => {
    const dependencies: string[] = [];

    addHeadersToDependencies(
      {channel: asOutputModel(unionHeaders)},
      headerGenerator,
      currentGenerator,
      dependencies,
      '.js'
    );

    expect(dependencies).toEqual([
      `import * as OrderLifecycleHeadersModule from './headers/OrderLifecycleHeaders.js';`
    ]);
  });
});
