# Implementation Plan: Testing Strategy Improvements

## Overview

This plan addresses two key gaps in the current testing strategy:
1. **Snapshot Coverage Gap**: Unit tests for channels only capture the index file, not individual protocol code
2. **Fixture Alignment Issue**: Test fixtures don't have parameters, making parameter-related test cases ineffective

## Problem Statement

### Issue 1: Channels Snapshots Only Capture Index File

**Current State** (`channels.spec.ts`):
- Snapshots only capture `generatedChannels.result` which is the index file content
- The actual protocol files (`nats.ts`, `kafka.ts`, etc.) are written to mocked filesystem but never captured
- Cannot detect regressions in protocol function signatures, implementations, or parameter handling

**Evidence** (from `channels.spec.ts.snap`):
```typescript
// This is ALL that's captured:
import * as nats from './nats';
import * as amqp from './amqp';
export {nats, amqp, mqtt, kafka, event_source};
```

### Issue 2: Parameter Fixture Mismatch

**Current State**:
- Test "should work with basic AsyncAPI inputs" uses `asyncapi.yaml` which has NO parameters
- Test manually injects `parameterModel` for channel `user/signedup`
- But `asyncapi.yaml` channel address is just `user/signedup` (no `{parameter}` placeholders)
- Test "should work with basic AsyncAPI inputs with no parameters" uses the SAME fixture
- Both tests produce IDENTICAL snapshots because neither actually exercises parameter code paths

**Evidence** (`test/configs/asyncapi.yaml`):
```yaml
channels:
  user/signedup:  # <-- No parameters!
    publish:
      message:
        $ref: '#/components/messages/UserSignedUp'
```

## Solution Overview

### Approach 1: Extend Return Type (Recommended)

Modify `TypeScriptChannelRenderType` to include all generated protocol code, not just the index file. This allows snapshots to capture the actual generated functions.

### Approach 2: Better Fixtures

Create or use fixtures that actually have parameters, payloads, and headers so tests exercise real code paths.

## Files to Create/Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/codegen/generators/typescript/channels/index.ts` | MODIFY | Return protocol file content in result |
| `src/codegen/generators/typescript/channels/types.ts` | MODIFY | Extend return type definition |
| `test/codegen/generators/typescript/channels.spec.ts` | MODIFY | Update tests to use proper fixtures and snapshot protocol code |
| `test/codegen/generators/typescript/__snapshots__/channels.spec.ts.snap` | UPDATE | Will be auto-updated with protocol code |
| `test/configs/asyncapi-channels.yaml` | CREATE | New fixture with parameters, payloads, and headers |

---

## Implementation Steps

### Step 1: Extend TypeScriptChannelRenderType

**File**: `src/codegen/generators/typescript/channels/types.ts`

**Current Type** (approximately):
```typescript
export type TypeScriptChannelRenderType = {
  parameterRender: TypeScriptParameterRenderType;
  payloadRender: TypeScriptPayloadRenderType;
  generator: TypeScriptChannelsGeneratorInternal;
  renderedFunctions: Record<string, TypeScriptChannelRenderedFunctionType[]>;
  result: string;  // <-- Only index file content
};
```

**Proposed Change**:
```typescript
export type TypeScriptChannelRenderType = {
  parameterRender: TypeScriptParameterRenderType;
  payloadRender: TypeScriptPayloadRenderType;
  generator: TypeScriptChannelsGeneratorInternal;
  renderedFunctions: Record<string, TypeScriptChannelRenderedFunctionType[]>;
  result: string;  // Index file content
  protocolFiles: Record<string, string>;  // NEW: Protocol -> file content
};
```

### Step 2: Populate protocolFiles in Generator

**File**: `src/codegen/generators/typescript/channels/index.ts:87-148`

**Changes to `finalizeGeneration()`**:
```typescript
async function finalizeGeneration(
  ...
): Promise<TypeScriptChannelRenderType> {
  await mkdir(context.generator.outputPath, {recursive: true});

  const generatedProtocols: string[] = [];
  const protocolFiles: Record<string, string> = {};  // NEW

  for (const [protocol, functions] of Object.entries(protocolCodeFunctions)) {
    if (functions.length === 0) {continue;}

    const deps = [...new Set(protocolDependencies[protocol] || [])];
    const depsSection = deps.join('\n');
    const depsNewline = deps.length > 0 ? '\n\n' : '';
    const functionsSection = functions.map((fn) => `export ${fn}`).join('\n\n');
    const fileContent = `${depsSection}${depsNewline}${functionsSection}\n`;

    await writeFile(
      path.resolve(context.generator.outputPath, `${protocol}.ts`),
      fileContent,
      {}
    );

    generatedProtocols.push(protocol);
    protocolFiles[protocol] = fileContent;  // NEW: Capture content
  }

  // ... index file generation ...

  return {
    parameterRender: parameters,
    payloadRender: payloads,
    generator: context.generator,
    renderedFunctions: externalProtocolFunctionInformation,
    result: indexContent,
    protocolFiles  // NEW: Include in return
  };
}
```

### Step 3: Create Better Test Fixture

**File**: `test/configs/asyncapi-channels.yaml` (NEW)

```yaml
asyncapi: 3.0.0
info:
  title: Channel Testing
  version: 1.0.0
  description: Fixture for testing channel generation with parameters, payloads, and headers
channels:
  userSignedup:
    address: user/signedup/{my_parameter}/{enum_parameter}
    parameters:
      my_parameter:
        description: A string parameter
      enum_parameter:
        description: An enum parameter
        enum: [option_a, option_b]
    messages:
      UserSignedUp:
        $ref: '#/components/messages/UserSignedUp'
  noParameter:
    address: noparameters
    messages:
      UserSignedUp:
        $ref: '#/components/messages/UserSignedUp'
operations:
  sendUserSignedup:
    action: send
    channel:
      $ref: '#/channels/userSignedup'
    messages:
      - $ref: '#/channels/userSignedup/messages/UserSignedUp'
  receiveUserSignedup:
    action: receive
    channel:
      $ref: '#/channels/userSignedup'
    messages:
      - $ref: '#/channels/userSignedup/messages/UserSignedUp'
  sendNoParameter:
    action: send
    channel:
      $ref: '#/channels/noParameter'
    messages:
      - $ref: '#/channels/noParameter/messages/UserSignedUp'
components:
  messages:
    UserSignedUp:
      payload:
        $ref: '#/components/schemas/UserSignedUpPayload'
      headers:
        $ref: '#/components/schemas/UserSignedUpHeaders'
  schemas:
    UserSignedUpPayload:
      type: object
      properties:
        display_name:
          type: string
          description: Name of the user
        email:
          type: string
          format: email
          description: Email of the user
    UserSignedUpHeaders:
      type: object
      properties:
        x-test-header:
          type: string
          description: Test header
```

### Step 4: Update channels.spec.ts

**File**: `test/codegen/generators/typescript/channels.spec.ts`

**Changes**:

1. **Update imports** to use `generateTypescriptPayload`, `generateTypescriptParameters`, `generateTypescriptHeaders` to create real dependencies (or continue with mocks but ensure they match the fixture)

2. **Add new test case** that uses the new fixture and snapshots protocol code:

```typescript
it('should generate correct NATS protocol code with parameters', async () => {
  const parsedAsyncAPIDocument = await loadAsyncapiDocument(
    path.resolve(__dirname, '../../../configs/asyncapi-channels.yaml')
  );

  // Generate real dependencies or create matching mocks
  const payloadsDependency = await generateTypescriptPayload({...});
  const parametersDependency = await generateTypescriptParameters({...});
  const headersDependency = await generateTypescriptHeaders({...});

  const generatedChannels = await generateTypeScriptChannels({
    generator: {
      ...defaultTypeScriptChannelsGenerator,
      outputPath: path.resolve(__dirname, './output'),
      id: 'test',
      asyncapiGenerateForOperations: false,
      protocols: ['nats']
    },
    inputType: 'asyncapi',
    asyncapiDocument: parsedAsyncAPIDocument,
    dependencyOutputs: {
      'parameters-typescript': parametersDependency,
      'payloads-typescript': payloadsDependency,
      'headers-typescript': headersDependency
    }
  });

  // Snapshot index file
  expect(generatedChannels.result).toMatchSnapshot('index');

  // Snapshot protocol file content
  expect(generatedChannels.protocolFiles['nats']).toMatchSnapshot('nats-protocol');
});
```

3. **Add tests for each protocol** to ensure all protocol generators are covered:

```typescript
describe('protocol-specific generation', () => {
  const protocols = ['nats', 'kafka', 'mqtt', 'amqp', 'event_source', 'websocket'];

  for (const protocol of protocols) {
    it(`should generate correct ${protocol} code with parameters`, async () => {
      // ... setup with asyncapi-channels.yaml ...

      const generatedChannels = await generateTypeScriptChannels({
        generator: {
          ...defaultTypeScriptChannelsGenerator,
          outputPath: path.resolve(__dirname, './output'),
          id: 'test',
          protocols: [protocol]
        },
        // ...
      });

      expect(generatedChannels.protocolFiles[protocol]).toMatchSnapshot();
    });
  }
});
```

### Step 5: Update Client Tests (Optional Enhancement)

**File**: `test/codegen/generators/typescript/client.spec.ts`

Currently this test has NO snapshots. Consider adding:

```typescript
expect(generatedClient.result).toMatchSnapshot('client-code');
```

This requires similar changes to the client generator's return type.

---

## Testing Strategy

### Unit Tests
After implementation:
- Run `npm run test` - Should pass with updated snapshots
- Run `npm run test:update` to regenerate snapshots
- Review generated snapshots to ensure they capture meaningful protocol code

### Blackbox Tests
- Run `npm run test:blackbox` - Should continue to pass (no behavioral changes)

### Runtime Tests
- Run `npm run runtime:typescript:test` - Should continue to pass (no behavioral changes)

---

## Success Criteria

- [ ] `TypeScriptChannelRenderType` includes `protocolFiles: Record<string, string>`
- [ ] `generateTypeScriptChannels()` returns protocol file content in `protocolFiles`
- [ ] New fixture `asyncapi-channels.yaml` created with parameters, payloads, and headers
- [ ] `channels.spec.ts` updated with tests that:
  - Use fixtures WITH parameters
  - Snapshot protocol-specific generated code
  - Cover multiple protocols
- [ ] Snapshots capture actual function signatures and implementations
- [ ] All existing tests continue to pass
- [ ] No TypeScript compilation errors
- [ ] Runtime tests continue to pass

---

## Estimated Complexity

**Medium**

- Type changes are straightforward
- Generator changes are localized to one function
- Test changes require careful fixture setup
- Snapshot updates are automatic

---

## Alternative Approaches Considered

### Alternative 1: Separate Protocol Snapshot Tests
Create separate test files for each protocol (e.g., `channels-nats.spec.ts`).

**Pros**: Better isolation
**Cons**: More files, more duplication, harder to maintain

### Alternative 2: Use Runtime Fixture Directly
Use `test/runtime/asyncapi-regular.json` in unit tests instead of creating new fixture.

**Pros**: Reuse existing fixture
**Cons**: Runtime fixture may change independently, coupling between test tiers

### Alternative 3: Mock Filesystem and Capture Writes
Instead of modifying return type, mock `writeFile` to capture written content.

**Pros**: No API changes
**Cons**: More complex test setup, less explicit about what's being tested

---

## Implementation Order

1. **Step 1**: Extend type definition (types.ts)
2. **Step 2**: Update generator to populate protocolFiles (index.ts)
3. **Step 3**: Create test fixture (asyncapi-channels.yaml)
4. **Step 4**: Update tests (channels.spec.ts)
5. **Step 5**: Run test:update and review snapshots
6. **Step 6**: (Optional) Apply similar pattern to client.spec.ts

---

## Rollback Plan

If issues arise:
1. Revert type changes in types.ts
2. Revert generator changes in index.ts
3. Remove new fixture
4. Restore original tests

The changes are additive and don't modify existing behavior, so rollback is straightforward.
