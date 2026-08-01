---
github_issue_url: [Full GitHub issue URL if applicable, otherwise omit this field]
status: draft
related_research: [Path to research document if applicable, otherwise omit this field]
---

# [Feature/Task Name] Implementation Plan

**Related Issue**: [GitHub issue URL as markdown link if applicable, e.g., [GH-1234](https://github.com/the-codegen-project/cli/issues/1234)]

---

## Pattern Decisions

Document the architectural patterns chosen for this implementation:

- **[Component type]:** [Pattern choice] (based on: [Reference file with line numbers if helpful])
- **[Another component]:** [Pattern] (based on: [Reference])
- **Utilities identified:** [List utilities to use with file paths]
- **Affected generators/protocols/input types:** [List what is impacted]

**Example:**

```markdown
- **Generator pattern:** Zod schema + `generateTypescript<Name>Core` + `inputType` switch (based on: src/codegen/generators/typescript/payloads.ts)
- **Config pattern:** optional Zod field with `.default()`, threaded through the Core options object (based on: src/codegen/generators/typescript/models.ts)
- **Protocol channel pattern:** publish/subscribe/request files under a protocol dir (based on: src/codegen/generators/typescript/channels/protocols/nats/)
- **Utilities identified:** output-path helpers (src/codegen/generators/typescript/utils.ts), shared codegen utils (src/codegen/utils.ts)
- **Affected generators/protocols/input types:** TypeScript payloads generator, AsyncAPI + OpenAPI inputs
```

---

## Overview

[Brief description of what we're implementing and why]

## Current State Analysis

[What exists now, what's missing, key constraints discovered]

## Desired End State

[A specification of the desired end state after this plan is complete, and how to verify it]

### Key Discoveries:

- [Important finding with file:line reference]
- [Pattern to follow]
- [Constraint to work within]

## Breaking Change Assessment

- **Does this change generated output?** [Yes/No - if yes, explain what changes]
- **Which generators / protocols / input types are affected?** [List]
- **Is this a major version bump?** [Yes/No - any change to generated output is a breaking change]

## What We're NOT Doing

[Explicitly list out-of-scope items to prevent scope creep]

## Implementation Approach

[High-level strategy and reasoning]

## Phase 1: [Descriptive Name]

### Overview

[What this phase accomplishes]

### Session Startup Protocol
1. Verify working directory: `pwd`
2. Check previous phase committed (if not Phase 1): `git log -1 --oneline`
3. Read progress JSON: `.claude/thoughts/shared/progress/{plan-name}-status.json`
4. Confirm current phase matches JSON `current_phase`

### Changes Required:

#### 1. [Component/File Group]

**File**: `path/to/file.ext` (lines X-Y or after function name)
**Change**: [Brief description - e.g., "Add new optional config field to the payload Zod schema"]

**Key Implementation Notes**:

- Design constraints: [e.g., "Every optional Zod field needs a `.default()`"]
- Required behavior: [e.g., "Must handle asyncapi, openapi, and jsonschema `inputType` values"]
- Edge cases: [e.g., "Handle schemas with no payloads gracefully"]
- Return type: [if critical to get right]
- Object-parameter convention: functions with 2+ params take a single destructured object (see `.cursor/rules/code-style.mdc`)

**Code Sketch** (only if logic is complex/non-obvious):

```[language]
// Show STRUCTURE, not complete implementation
// Focus on WHY, not WHAT
switch (inputType) {
  case 'asyncapi':
    // delegate to inputs/asyncapi processor then the Core function
    // WHY: each input type produces Processed*SchemaData differently
    break;
  case 'openapi':
  case 'jsonschema':
    // ...
    break;
}
```

### Success Criteria:

#### Automated Verification:
- Tests pass: `npm test`
- Type checking / build passes: `npm run build`
- Linting passes: `npm run lint`
- Snapshot tests reviewed: `npm run test:update` (if output changed intentionally)
- Assets regenerated (if Zod config changed): `npm run generate:assets`

### Session Completion
1. All changes staged: `git add -A`
2. Update progress JSON: set phase 1 to "complete", increment current_phase
3. Verify clean state: `git status` shows clean working tree

---

## Phase 2: [Descriptive Name]

### Overview

[What this phase accomplishes]

### Session Startup Protocol
1. Verify working directory: `pwd`
2. Check previous phase staged: `git diff --cached`
3. Read progress JSON: `.claude/thoughts/shared/progress/{plan-name}-status.json`
4. Confirm current phase matches JSON `current_phase`

### Changes Required:

[Similar structure to Phase 1...]

### Success Criteria:

#### Automated Verification:
- Tests pass: `npm test`
- Type checking / build passes: `npm run build`
- Linting passes: `npm run lint`

### Session Completion
1. All changes committed: `git add -A && git commit -m "Phase 2: [description]"`
2. Update progress JSON: set phase 2 to "complete", increment current_phase
3. Verify clean state: `git status` shows clean working tree

---

[Continue with as many phases as needed - the number of phases is DYNAMIC based on scope]

---

## Testing Strategy

**IMPORTANT: Follow Test-Driven Development (TDD) and the repo's "Expected Output First" philosophy**

### TDD Approach:

1. **For new files**: Create minimal structure first (empty functions with correct signatures) to prevent import errors
2. **Expected Output First** (for generator/protocol work): manually write the desired generated output and its test in `test/runtime/typescript/` before building the generator
3. **For each feature**: Write failing test → Run test → Implement → Run test (pass) → Refactor
4. **Verify**: Run `npm test` after each cycle

### Unit Tests:

Unit tests verify that the **correct code is generated** (output correctness).

- [What to test - written BEFORE implementation]
- [Key edge cases]
- Test file locations mirror `src/codegen/` structure under `test/codegen/`
- Use snapshot testing: `expect(result).toMatchSnapshot()`

### Blackbox Tests (syntax):

Blackbox tests run real config × input combinations and type-check the generated output.

- [Config/input combinations to cover in `test/blackbox/`]
- Run with: `npm run test:blackbox`

### Runtime Tests (semantic):

Runtime tests verify that the **generated code is semantically correct** (compiles, runs, behaves correctly, works against live brokers where relevant).

- [What to add/update in `test/runtime/typescript/` — generation scripts (`codegen-*.mjs`) and specs under `test/runtime/typescript/test/`]
- [What generated code behavior to verify]
- Broker-backed protocols use docker compose files in `test/runtime/` (NATS, Kafka, MQTT, AMQP)
- Run with: `npm run runtime:typescript` (start services first with `npm run runtime:services:start`)

### Examples (REQUIRED):

A feature without examples doesn't exist. Examples serve as both documentation and showcase projects.

- [Example to create/update in `examples/`]
- Follow the structure of an existing example (e.g. `examples/openapi-http-client/`, `examples/ecommerce-asyncapi-payload/`)

### Documentation (REQUIRED):

A feature without documentation doesn't exist.

- [Docs to create/update in `docs/`]
- [Generator docs: `docs/generators/`]
- [Protocol docs: `docs/protocols/`]
- [Input docs: `docs/inputs/`]
- [Config docs: `docs/configurations.md`, `docs/usage.md`]

### Assets (REQUIRED if Zod config changed):

Zod is the single source of truth. Changing a generator's Zod schema requires regenerating the JSON schemas in `schemas/` and the command docs.

- Run `npm run generate:assets` — never hand-edit files in `schemas/`

## Breaking Change Notes

[If this changes generated output, document exactly what changes and why. Any change to generated output is a breaking change requiring a major version bump.]

## Final Verification

- Run the project quality gate: `npm run prepare:pr` (build → generate:assets → lint:fix → test:update → runtime:typescript:generate)

## References

- Similar implementation: `[file:line]`
- Related documentation: `[docs path]`
- Authoritative specs: `.cursor/rules/*.mdc` (generators.mdc, inputs.mdc, protocols.mdc, code-style.mdc, testing.mdc)
