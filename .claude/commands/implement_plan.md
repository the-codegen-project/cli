---
description: Implement technical plans from .claude/thoughts/shared/plans with verification
---


# Implement Plan

You are tasked with implementing an approved technical plan from `.claude/thoughts/shared/plans/`. These plans contain phases with specific changes and success criteria.

## Getting Started

When given a plan path:

- Read the progress JSON at `.claude/thoughts/shared/progress/{plan-name}-status.json` for current phase
- Read the plan completely to understand what needs to be done
- Read the original ticket if referenced
- **Use specialized agents to analyze the codebase** (see Context Management below)
- Think deeply about how the pieces fit together based on agent findings
- Create a todo list to track your progress
- Start implementing if you understand what needs to be done

If no plan path provided, ask for one.

## Context Management

To keep the main conversation context lean and focused on implementation decisions:

- **Use codegen-analyzer agent** to understand how the TypeScript generators work within `src/codegen/generators/`

  - Request focused analysis of specific generators, not full directory dumps
  - Example: "Analyze `generateTypescriptPayloadsCore` in `src/codegen/generators/typescript/payloads.ts` and trace how it turns processed schema data into rendered files"

- **Use input-analyzer agent** to understand input processing within `src/codegen/inputs/`

  - Example: "Analyze how `src/codegen/inputs/asyncapi/parser.ts` normalizes an AsyncAPI document into Processed*SchemaData"

- **Use codebase-pattern-finder agent** to search for similar patterns in the codebase

  - Even if you don't expect to find patterns, verify assumptions
  - Example: "Find generators that define a `zodTypeScript<Name>Generator` schema with defaulted optional fields"
  - **CRITICAL**: Use this to find reference implementations for the SAME component type you're building
    - Building a generator? Find another generator in `src/codegen/generators/typescript/` (payloads, models, parameters, headers)
    - Adding a protocol channel? Look at existing protocols in `src/codegen/generators/typescript/channels/protocols/`
    - Adding an input processor? Look at existing processors in `src/codegen/inputs/`

- **Use codebase-locator agent** to find where specific files, components, or utilities live

  - Example: "Find where the Zod discriminated unions for generators are defined in `src/codegen/types.ts`"

- **Use thoughts-locator agent** if you need related research/decisions not already referenced in the plan

- **Only read files directly** in the main context when you're about to edit them

  - This keeps full file contents out of context until needed
  - Agent summaries are sufficient for understanding current state

- **Launch agents in parallel** when possible to speed up analysis
  - Example: Run codegen-analyzer and codebase-pattern-finder simultaneously

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:

- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- **Match existing code patterns** - use codebase-pattern-finder agent to find reference implementations
- Verify your work makes sense in the broader codebase context
- Update the progress JSON as you complete phases
- **Be aware of breaking changes** - any change to generated output is a breaking change

**Plans provide WHAT and WHY, you provide HOW**:

- The plan tells you WHAT to build and WHY decisions matter (constraints, edge cases)
- You determine HOW by finding and following existing patterns in the codebase
- Use utilities that already exist (don't reinvent parsing, config loading, rendering, formatting, etc.)
- Match the style of similar components (other generators, input processors, protocol channels)
- Follow the repo conventions in `.cursor/rules/*.mdc` (generators.mdc, inputs.mdc, protocols.mdc, code-style.mdc, testing.mdc) - they are authoritative

When things don't match the plan exactly, think about why and communicate clearly. The plan is your guide, but your judgment matters too.

If you encounter a mismatch:

- STOP and think deeply about why the plan can't be followed
- Present the issue clearly:

  ```
  Issue in Phase [N]:
  Expected: [what the plan says]
  Found: [actual situation]
  Why this matters: [explanation]

  How should I proceed?
  ```

## Test-Driven Development (TDD) Approach

**You MUST follow TDD for all code changes:**

1. **For new files**: Create minimal structure first (empty functions with correct signatures) to prevent import errors in tests
2. **For each feature/change**:
   - Write a failing test that validates the desired behavior
   - Run `npm test -- -t "test name"` to confirm it fails for the right reason
   - Write ONLY enough code to make the test pass
   - Run `npm test -- -t "test name"` to confirm it passes
   - Refactor if needed while keeping tests green
3. **Snapshot tests**: Use `expect(result).toMatchSnapshot()` for generated output. Review snapshot changes carefully - any change to generated output is a breaking change.
4. **Zod schema changes**: If you change a generator's Zod schema (add/rename/default a field), run `npm run generate:assets` to regenerate the JSON schemas in `schemas/` and the command docs in `docs/` - never hand-edit those generated files.

## Verification Approach

After implementing a phase:

- Run the success criteria checks (three-tier testing):
  - Unit tests: `npm test` (or `npm test -- -t "test name"` for specific tests) - logic and syntax of generator functions
  - Blackbox tests: `npm run test:blackbox` - type-checks real config × input combinations of generated output (only when the change affects generated output)
  - Runtime tests: `npm run runtime:typescript` - proves generated code works semantically against live brokers in Docker (only when the change affects protocol/runtime behavior)
  - Type checking / Build: `npm run build`
  - Linting: `npm run lint`
  - Snapshot review: If snapshots changed, run `npm run test:update` only after confirming the changes are intentional
- Fix any issues before proceeding
- Update your progress in both the plan and your todos
- Check off completed items in the plan file itself using Edit

Don't let verification interrupt your flow - batch it at natural stopping points.

**Final gate**: Before considering the whole plan complete, run `npm run prepare:pr` (build → generate:assets → lint:fix → test:update → runtime:typescript:generate). This is the project's mandatory quality gate - the task is not done until it passes.

## If You Get Stuck

When something isn't working as expected:

- First, make sure you've read and understood all the relevant code
- Consider if the codebase has evolved since the plan was written
- Present the mismatch clearly and ask for guidance

Use sub-tasks sparingly - mainly for targeted debugging or exploring unfamiliar territory.

## When to Stop and Ask

You should work autonomously as much as possible, but stop and ask when:

- Plan references files/APIs that don't exist and you can't find suitable alternatives
- Plan approach directly conflicts with existing code patterns you discovered
- Tests fail in unexpected ways unrelated to your changes
- You need design decisions (e.g., should this be a new generator or an option on an existing one?)
- Implementation requires breaking changes not mentioned in the plan
- You've debugged thoroughly but can't identify root cause of a failure

When blocked, present: what you tried, what happened, what you've learned, and what options you see. Don't stop for things you can research, debug, or reasonably infer from the codebase.

## Session Startup Protocol

Before starting any phase (including first phase), execute this protocol:

1. **Verify working directory**: Run `pwd` to confirm location
2. **Read progress JSON**: Check `.claude/thoughts/shared/progress/{plan-name}-status.json`
   - Identify `current_phase` value
   - Confirm phases array matches plan structure
   - If no JSON exists (legacy plan), determine status from git history
3. **Verify previous work** (if not Phase 1):
   - Run `git log -1 --oneline` to see last commit
   - Confirm previous phase was committed (commit message should reference phase)
4. **Read plan phase**: Go to the phase matching `current_phase` in JSON
5. **Create todos from plan**: Use TodoWrite to track:
   - Session Startup Protocol steps
   - Implementation tasks from "Changes Required"
   - Session Completion steps
6. **Baseline check**: Run `npm test` on affected test files (if any exist) to verify known-good state

## Resuming Work

When continuing an in-progress plan:

1. **Read progress JSON first**: `.claude/thoughts/shared/progress/{plan-name}-status.json`
   - `current_phase` tells you exactly where to resume
   - Status values: "complete", "in_progress", "pending"

2. **Execute Session Startup Protocol** for current phase

3. **Continue implementation** from current phase

**Fallback for legacy plans**: If no progress JSON exists, determine status by reading the plan and checking git history for phase commits.

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.

## Phase Completion Protocol

After completing each phase:

1. **Commit phase work**:
   ```bash
   git add -A
   git commit -m "Phase N: [brief description]

   Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
   ```

2. **Update progress JSON**:
   - Set current phase status to "complete"
   - Increment `current_phase` value
   - Set next phase status to "in_progress" (if continuing)

3. **Verify clean state**:
   - `git status` should show clean working tree
   - Run relevant tests to confirm nothing broken

4. **Update todos**: Mark phase todos as completed, create new todos for next phase

## Pattern Research Guidelines

When implementing, use codebase-pattern-finder agent extensively to match existing code style:

**Pattern Research is Contextual** - Match your research to what you're building:

- **Working on a Generator?** → Find other generators in `src/codegen/generators/typescript/` (payloads, models, parameters, headers), examine how they define a `zodTypeScript<Name>Generator` schema, `z.input<>`/`z.infer<>` types, a `generateTypescript<Name>Core` function, and a `generateTypescript<Name>` entry that switches on `inputType`
- **Working on a Protocol channel?** → Find similar protocols in `src/codegen/generators/typescript/channels/protocols/` (nats, kafka, mqtt, amqp, eventsource, http, websocket) and see how publish/subscribe helpers are structured
- **Working on an Input processor?** → Find how other processors in `src/codegen/inputs/` (asyncapi, openapi, jsonschema) parse a document and produce Processed*SchemaData
- **Working on a Client?** → Look at `src/codegen/generators/typescript/client/` and its protocol implementations
- **Working on a Custom generator?** → Look at `src/codegen/generators/generic/custom.ts`
- **Adding to an existing generator/module?** → Examine that file's existing structure and patterns

**Pattern Categories by Component:**

- **Generators:** The fixed shape - Zod schema (`id`, `preset`, `outputPath`, `language`, `.default()` on optionals), `z.input<>` external + `z.infer<>` internal types, `generateTypescript<Name>Core` function, `generateTypescript<Name>` entry switching on `inputType`; registration in the Zod discriminated unions in `src/codegen/types.ts`
- **Protocol channels:** How publish/subscribe/request/reply helpers are generated, MQTT v5 requirements and topic filtering (see protocols.mdc)
- **Input processors:** Parsing, `$ref` resolution, normalization into Processed*SchemaData
- **Clients:** How protocol channels are composed into a full client
- **All Implementations:** Object-parameter convention (functions with 2+ params take a single destructured object with an explicit type), `Logger` from `src/LoggingInterface.ts` (never `console.log`), no sync file ops in generators

**Key Principles:**

1. Search for patterns in the SAME COMPONENT TYPE first - a new generator should mirror an existing generator, a new protocol should mirror an existing protocol
2. Look for the SAME TYPE of component - Generators reference Generators, Input processors reference Input processors, etc.
3. When in doubt, find 2-3 examples of the same component type and follow the most common pattern

**Agent Usage Examples:**

```
# Finding generator structure patterns
Agent: codebase-pattern-finder
Prompt: "Find 2-3 TypeScript generators that define a zodTypeScript<Name>Generator schema and a generateTypescript<Name>Core function. Show how the schema, types, and entry function are structured."
```

```
# Finding where generators are registered
Agent: codebase-locator
Prompt: "Find where the Zod discriminated unions (zodAsyncAPITypeScriptGenerators, zodOpenAPITypeScriptGenerators, zodJsonSchemaTypeScriptGenerators) are defined and how generators register their preset."
```

```
# Understanding a specific generator
Agent: codegen-analyzer
Prompt: "Analyze payloads.ts. Show how generateTypescriptPayloadsCore consumes processed schema data and wraps Modelina's TypeScriptFileGenerator to write files."
```
