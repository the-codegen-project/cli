---
description: Create detailed implementation plans through interactive research and iteration
---


# Implementation Plan

You are tasked with creating detailed implementation plans through an interactive, iterative process. You should be skeptical, thorough, and work collaboratively with the user to produce high-quality technical specifications.

## Initial Response

When this command is invoked:

1. **Check if parameters were provided**:

   - If a file path or issue reference was provided as a parameter, skip the default message
   - Immediately read any provided files FULLY
   - Begin the research process

2. **If no parameters provided**, respond with:

```
I'll help you create a detailed implementation plan. Let me start by understanding what we're building.

Please provide:
1. The task/issue description (or reference to a GitHub issue)
2. Any relevant context, constraints, or specific requirements
3. Links to related research or previous implementations

I'll analyze this information and work with you to create a comprehensive plan.

Tip: You can also invoke this command with an issue reference directly: `/create_plan GitHub issue #1234`
For deeper analysis, try: `/create_plan think deeply about GitHub issue #1234`
```

Then wait for the user's input.

## Research Path Decision

After reading any provided files, determine which path to follow:

**PATH A: Comprehensive Research Available**

- User explicitly provides a research document path, OR
- GitHub issue number mentioned AND matching research found in `.claude/thoughts/shared/research/*GH-XXXX*.md`
- **Flow**: Read research → Present summary → Get confirmation → Write plan (Step 4)

**PATH B: Lightweight Research Required**

- No comprehensive research document available
- **Flow**: Initial research → Deeper discovery → Structure development → Write plan (Step 4)

---

## PATH A: Using Comprehensive Research

### Step A1: Read Research Document

1. **Read the research document FULLY** into main context
2. **DO NOT read any other files directly** - trust the research document contains all necessary information

### Step A2: Present Summary and Get Confirmation

Present to user:

```
Based on the research at [path], I understand we need to [accurate summary].

Key findings from the research:
- [Key finding 1 with file:line reference from research]
- [Key finding 2 with pattern/constraint]
- [Important architectural decision]

The research was comprehensive and includes all implementation details.
I'm ready to create the implementation plan based on these findings.

Any clarifications or changes before I proceed?
```

### Step A3: Skip to Plan Writing

After user confirms, proceed directly to **Step 4: Write Plan**

---

## PATH B: Lightweight Research

**IMPORTANT**: Use extended thinking throughout this path to deeply reason about the problem space, architecture, and implementation approach.

As you think, consider:

- What assumptions am I making that need verification?
- What could break if related code changes?
- Are there edge cases not explicitly covered?
- How does this fit with existing architectural patterns?
- What dependencies or side effects exist?
- Could this change affect generated output (breaking change)?
- Does this need to be applied across multiple generators or protocols?

### Step B1: Initial Context Gathering

1. **Read all mentioned files FULLY**:

   - Issue files or GitHub issues
   - If GitHub issue URL provided: use `gh issue view <number> --json title,body,labels,comments --repo the-codegen-project/cli`
   - Any config, schema, or spec files mentioned
   - **IMPORTANT**: Read entire files (no limit/offset parameters)
   - **Consult the authoritative specs**: the relevant `.cursor/rules/*.mdc` files (`generators.mdc`, `inputs.mdc`, `protocols.mdc`, `code-style.mdc`, `testing.mdc`, `modelina-presets.mdc`) and the matching skills (`add-generator`, `add-input-type`, `add-protocol`, `prepare-pr`)

2. **Spawn initial research agents in parallel** with pattern-focused prompts:

   - **codebase-locator** - "Find all files related to [task]. Also identify utility functions for [common operations like naming, output paths, type mapping, etc.]"
   - **codegen-analyzer** - "Analyze the current implementation of [generator/protocol channel/client] and identify its Zod config, Core function, and inputType handling" (use for `src/codegen/generators/` questions)
   - **input-analyzer** - "Analyze how [input format] is parsed and normalized into Processed*SchemaData" (use for `src/codegen/inputs/` questions)
   - **codebase-pattern-finder** - "Find reference implementations for similar [generators/protocols/input processors/custom generators] to identify structural patterns"

   **Pattern Research is Contextual** - Look for patterns that match what you're building:

   - Working on a **Generator**? → Find other generators in `src/codegen/generators/typescript/` (e.g. `payloads.ts`, `models.ts`, `parameters.ts`, `headers.ts`, `types.ts`)
   - Working on a **Protocol channel**? → Find other protocols in `src/codegen/generators/typescript/channels/protocols/<protocol>/`
   - Working on a **Client**? → Look at `src/codegen/generators/typescript/client/`
   - Working on a **Custom generator**? → Look at `src/codegen/generators/generic/custom.ts`
   - Working on an **Input processor**? → Find other input handling in `src/codegen/inputs/{asyncapi,openapi,jsonschema}/`
   - Working on **config/types wiring**? → Look at `src/codegen/types.ts` (Zod discriminated unions) and `src/codegen/configurations.ts`

   For each component type, focus on:

   - **Generators:** the `zodTypeScript<Name>Generator` schema shape, `generateTypescript<Name>Core` function, the `generateTypescript<Name>` entry that switches on `inputType`, registration in `src/codegen/types.ts`, output path handling
   - **Protocol channels:** publish/subscribe/request/reply file structure, protocol version requirements (e.g. MQTT v5 user properties + topic filtering), dependency imports
   - **Input processors:** document parsing/`$ref` resolution in `parser.ts`, and the `generators/` layer that produces `Processed*SchemaData`
   - **Config:** Zod `.default()` on every optional, `z.input<>`/`z.infer<>` type duality, discriminated union keyed on `preset`
   - **Renderer:** how generators are ordered by dependency in `src/codegen/renderer.ts` (graphology graph)

3. **Read all files identified by research agents FULLY**

4. **Think deeply and analyze**:

   - Cross-reference issue requirements with actual code
   - Identify discrepancies or misunderstandings
   - Note assumptions that need verification
   - Consider edge cases and architectural implications
   - **Assess breaking change risk** - will this change generated output?
   - **Assess cross-cutting impact** - does this touch multiple generators, protocols, or input types?

5. **Present informed understanding**:

   ```
   Based on the issue and my research of the codebase, I understand we need to [accurate summary].

   I've found that:
   - [Current implementation detail with file:line reference]
   - [Relevant pattern or constraint discovered]
   - [Potential complexity or edge case identified]

   Questions that my research couldn't answer:
   - [Specific technical question that requires human judgment]
   - [Design preference that affects implementation]
   ```

   Only ask questions you genuinely cannot answer through code investigation.

### Step B2: Deeper Discovery

After getting initial clarifications:

1. **If user corrects any misunderstanding**:

   - DO NOT just accept the correction
   - Spawn new research agents to verify
   - Read the specific files/directories they mention
   - Only proceed once verified

2. **Create research todo list** using TodoWrite

3. **Spawn parallel research agents for deeper investigation**:

   - **codebase-locator** - Find more specific files
   - **codegen-analyzer** - Understand generator/protocol/client implementation details
   - **input-analyzer** - Understand input parsing and normalization details
   - **codebase-pattern-finder** - Find similar features to model after

   **Pattern Research Focus:**
   When using codebase-pattern-finder, look for:

   - Reference implementations of the SAME component type (another generator, another protocol, another input type — local conventions matter)
   - Specific structural patterns: Zod schema fields and defaults, function signatures (object-parameter convention), return types
   - How similar components handle edge cases (empty schemas, nested types, `$ref` cycles, missing optional config)
   - Common utilities being used instead of manual implementations (from `src/codegen/utils.ts`, `src/codegen/generators/typescript/utils.ts`, `src/codegen/inputs/*/utils.ts`)

4. **Wait for ALL agents to complete**

5. **Think deeply about design options**:

   - Reason through multiple implementation approaches
   - Consider trade-offs, maintainability, config surface
   - Evaluate alignment with existing patterns
   - Identify potential risks and mitigation strategies
   - **Consider snapshot test impact** - what will change in generated output (`test/codegen/`)?
   - **Consider blackbox test impact** - will generated code still type-check (`test/blackbox/`)?
   - **Consider runtime test impact** - will generated code still compile and run against brokers (`test/runtime/typescript/`)?

6. **Present findings and design options**:

   ```
   Based on my research, here's what I found:

   **Current State:**
   - [Key discovery about existing code]
   - [Pattern or convention to follow]

   **Design Options:**
   1. [Option A] - [pros/cons]
   2. [Option B] - [pros/cons]

   **Breaking Change Assessment:**
   - [Will this change generated output? How?]
   - [Which generators / protocols / input types are affected?]

   **Open Questions:**
   - [Technical uncertainty]
   - [Design decision needed]

   Which approach aligns best with your vision?
   ```

### Step B3: Plan Structure Development

Once aligned on approach:

1. **Create initial plan outline following TDD structure**:

   ```
   Here's my proposed plan structure (following TDD red-green-refactor):

   ## Overview
   [1-2 sentence summary]

   ## Implementation Phases:
   [Dynamic number of phases based on what needs to change]
   - Zod Config / Types Updates (if needed)
   - Expected Output First (write desired generated output + its test in test/runtime/typescript/ before building the generator)
   - For each component: Write Tests (TDD - RED) → Implement (TDD - GREEN)
   - Examples & Documentation (REQUIRED for any feature)
   - Runtime Tests (REQUIRED - verify generated code is semantically correct against brokers)
   - Update Snapshot Tests
   - Regenerate Assets (schemas/ + docs) via npm run generate:assets (if Zod config changed)
   - Verify All Tests Pass (TDD - GREEN verification)
   - Refactor (TDD - REFACTOR)

   Does this phasing make sense? Should I adjust the order or granularity?
   ```

   **Key principles for phase ordering**:
   - The number of phases is DYNAMIC - adapt to the scope of the change (a small bug fix may need 4 phases, a new generator or protocol may need 15+)
   - Start with Zod config/type changes in the generator file + `src/codegen/types.ts` (no tests needed for pure type/schema additions, but they must regenerate `schemas/`)
   - Follow "Expected Output First": for generator work, manually write the desired generated output and its test in `test/runtime/typescript/` before building the generator that produces it
   - For each component, pair RED (write tests) with GREEN (implement)
   - Examples and documentation are MANDATORY for any feature (a feature without docs and examples doesn't exist)
   - Runtime tests are MANDATORY (unit/snapshot tests verify correct code generation, runtime tests verify the generated code is semantically correct)
   - Snapshot test review near the end (after implementation stabilizes)
   - Always end with verification and refactor phases, and the `npm run prepare:pr` quality gate

2. **Get feedback on structure** before writing details

---

## Step 4: Write Plan (Both Paths Converge Here)

After structure approval:

**TDD Phase Structure (MANDATORY):**

All implementation plans MUST follow Test-Driven Development (TDD). Structure phases using the red-green-refactor cycle:

1. **Zod config / type changes first** (if needed - no tests required for pure schema/type additions, but changing a generator's Zod schema requires regenerating `schemas/` and docs via `npm run generate:assets`)
2. **Expected Output First** (for generator/protocol work): write the desired generated output and its test in `test/runtime/typescript/` before building the generator
3. **For each component to implement**:
   - **Phase N: Write Tests (RED)**: Write failing tests for the component
   - **Phase N+1: Implement (GREEN)**: Implement just enough to make tests pass
4. **Examples & Documentation** (REQUIRED for any feature):
   - **Phase: Add Example**: Create working example in `examples/`
   - **Phase: Update Documentation**: Update relevant docs in `docs/`
5. **Runtime Tests** (REQUIRED):
   - **Phase: Runtime Verification**: Add/update runtime tests in `test/runtime/typescript/` to verify generated code is semantically correct (compiles, runs, behaves correctly, works against brokers where relevant)
6. **Final phases**:
   - **Phase: Update Snapshots**: Review and update snapshot tests (`npm run test:update`)
   - **Phase: Regenerate Assets**: If any Zod config changed, run `npm run generate:assets` to regenerate `schemas/`, README ToC, and command docs
   - **Phase: Verify All Tests Pass**: Run `npm run prepare:pr` (build → generate:assets → lint:fix → test:update → runtime:typescript:generate)
   - **Phase: Refactor (REFACTOR)**: Clean up code while keeping tests green

**The number of phases is dynamic** - scale to what the change requires. A small config fix may need 5 phases. A new protocol or input type may need 20+. Don't force a fixed count.

**Example phase naming (small change - generator config fix)**:
- Phase 1: Write Tests for Payload Output Path Option (TDD - RED)
- Phase 2: Fix Payload Generator Output Path Handling (TDD - GREEN)
- Phase 3: Update Example & Documentation
- Phase 4: Regenerate Assets (`npm run generate:assets`)
- Phase 5: Runtime Test Verification
- Phase 6: Verify All Tests Pass (`npm run prepare:pr`)

**Example phase naming (large change - new protocol channel)**:
- Phase 1: Zod Config & Types Updates (`src/codegen/generators/typescript/channels/types.ts`, `src/codegen/types.ts`)
- Phase 2: Expected Output First — write desired output + test in `test/runtime/typescript/`
- Phase 3: Write Tests for Protocol Publish Helper (TDD - RED)
- Phase 4: Implement Protocol Publish Helper (TDD - GREEN)
- Phase 5: Write Tests for Protocol Subscribe Helper (TDD - RED)
- Phase 6: Implement Protocol Subscribe Helper (TDD - GREEN)
- Phase 7: Wire protocol into channels dispatch (`channels/index.ts`)
- Phase 8: Add Example in `examples/`
- Phase 9: Update Documentation in `docs/protocols/`
- Phase 10: Add/Update Runtime Tests in `test/runtime/typescript/`
- Phase 11: Update Snapshot Tests
- Phase 12: Regenerate Assets (`npm run generate:assets`)
- Phase 13: Verify All Tests Pass (`npm run prepare:pr`) (TDD - GREEN verification)
- Phase 14: Refactor (TDD - REFACTOR)

**Test-First Guidelines**:
- Tests MUST be written BEFORE implementation for each component
- Each RED phase should specify:
  - Test file location (mirroring `src/codegen/` structure under `test/codegen/`, or the runtime project under `test/runtime/typescript/`)
  - Specific test cases to write
  - Expected outcome: "All tests FAIL (function doesn't exist yet)"
- Each GREEN phase should reference the tests from previous RED phase
- Include refactor phase at end for cleanup while tests stay green

**Pre-Write Validation:**

Before writing the plan file, verify:

- [ ] All referenced files and patterns actually exist in the codebase
- [ ] Breaking change impact is clearly documented
- [ ] Cross-cutting impact is assessed (which generators / protocols / input types need changes)
- [ ] Snapshot test changes are anticipated and described
- [ ] Asset regeneration is planned if any Zod config changed (`npm run generate:assets`)
- [ ] Plan includes example and documentation phases (features without docs/examples don't exist)
- [ ] Plan includes runtime test phases (generated code must be semantically verified)

**Document Pattern Decisions:**
At the top of the plan (before Overview), include a "Pattern Decisions" section that documents:

```markdown
**Pattern Decisions**:

- [Component] pattern: [chosen approach] (based on: [reference file])
- [Another component]: [pattern] (based on: [reference])
- Utilities identified: [list with file paths]
- Affected generators/protocols/input types: [list]
```

Example:

```markdown
**Pattern Decisions**:

- Generator pattern: Zod schema + `generateTypescript<Name>Core` + `inputType` switch (based on: src/codegen/generators/typescript/payloads.ts)
- Protocol channel pattern: publish/subscribe/request files under a protocol dir (based on: src/codegen/generators/typescript/channels/protocols/nats/)
- Utilities identified: output-path helpers (src/codegen/generators/typescript/utils.ts), shared codegen utils (src/codegen/utils.ts)
- Affected generators/protocols/input types: TypeScript channels generator, NATS protocol (AsyncAPI input only)
```

1. **Write the plan** to `.claude/thoughts/shared/plans/YYYY-MM-DD-GH-XXXX-description.md`

   - **Use the template at `.claude/templates/implementation_plan.md`** as the structure for the plan
   - Format: `YYYY-MM-DD-GH-XXXX-description.md` where:
     - YYYY-MM-DD is today's date
     - GH-XXXX is the GitHub issue number (omit if no issue)
     - description is a brief kebab-case description
   - Examples:
     - With issue: `.claude/thoughts/shared/plans/2026-07-08-GH-402-add-websocket-request-reply.md`
     - Without issue: `.claude/thoughts/shared/plans/2026-07-08-improve-payload-output-paths.md`

2. **Generate progress JSON** at `.claude/thoughts/shared/progress/{plan-name}-status.json`

   Extract phase information from the plan and create a status file:
   ```json
   {
     "plan": "{plan-name}.md",
     "current_phase": 1,
     "total_phases": 8,
     "phases": [
       {"id": 1, "name": "[Phase 1 name from plan]", "status": "pending"},
       {"id": 2, "name": "[Phase 2 name from plan]", "status": "pending"}
     ]
   }
   ```

### Step 5: Sync and Review

1. **Present the draft plan location**:

   ```
   I've created the initial implementation plan at:
   `.claude/thoughts/shared/plans/YYYY-MM-DD-GH-XXXX-description.md`

   Progress tracker created at:
   `.claude/thoughts/shared/progress/YYYY-MM-DD-GH-XXXX-description-status.json`

   Please review the plan and let me know:
   - Are the phases properly scoped?
   - Are the success criteria specific enough?
   - Any technical details that need adjustment?
   - Missing edge cases or considerations?
   - Is the breaking change assessment accurate?
   ```

2. **Iterate based on feedback** - be ready to:

   - Add missing phases
   - Adjust technical approach
   - Clarify success criteria
   - Add/remove scope items
   - Reassess cross-cutting impact

3. **Continue refining** until the user is satisfied

## Important Guidelines

1. **Be Skeptical**:

   - Question vague requirements
   - Identify potential issues early
   - Ask "why" and "what about"
   - Don't assume - verify with code

1. **Do NOT Include**:

   - Time estimates or effort calculations (wasted tokens, no value)
   - Timeline projections or duration guesses
   - Any section not explicitly in the plan template

1. **Be Interactive**:

   - Don't write full plan in one shot (except when comprehensive research available)
   - Get buy-in at each step during lightweight research
   - Allow course corrections at any stage
   - Work collaboratively throughout the process

1. **Be Thorough**:

   - Read all context files COMPLETELY before planning
   - Research actual code patterns using parallel sub-tasks
   - Include specific file paths and line numbers
   - Write measurable success criteria
   - Automated checks should reference the project quality gates: `npm test`, `npm run lint`, `npm run build`, and the full `npm run prepare:pr`

1. **Be Practical**:

   - Focus on incremental, testable changes
   - Consider backward compatibility and breaking changes
   - Think about edge cases
   - Include "what we're NOT doing"
   - Consider which generators / protocols / input types are affected and which are not

1. **Follow TDD Structure**:

   - ALWAYS structure phases around red-green-refactor cycle
   - Zod config/type changes first (no tests needed for pure schema/type additions, but regenerate `schemas/`)
   - Follow "Expected Output First" for generator work (write desired output + test before building)
   - For each component: Write Tests (RED) → Implement (GREEN)
   - ALWAYS include examples and documentation phases (a feature without docs/examples doesn't exist)
   - ALWAYS include runtime test phases (unit tests verify correct code generation, runtime tests verify the generated code is semantically correct)
   - End with: Update Snapshots → Regenerate Assets → Verify Tests Pass (`prepare:pr`) → Refactor
   - Label each phase clearly: "(TDD - RED)", "(TDD - GREEN)", "(TDD - REFACTOR)"
   - Specify expected test outcomes in each phase
   - Number of phases is DYNAMIC - adapt to the scope of the change

1. **Write Intent-Focused Code Guidance**:

   The implementation agent will read actual files and use specialized agents to analyze patterns. Don't write complete implementations - focus on INTENT and CONSTRAINTS.

   **For each change, provide**:

   - **Location**: File path + line numbers or function name
   - **What to change**: Brief description (e.g., "Add new optional `functionName` field to the payload Zod schema")
   - **Key implementation notes**: Critical decisions as bullet points:
     - Design constraints (e.g., "Every optional Zod field needs a `.default()`")
     - Required behavior (e.g., "Must handle asyncapi, openapi, and jsonschema `inputType` values")
     - Edge cases to handle (e.g., "Handle schemas with no payloads gracefully")
   - **Optional code sketch**: Only when the approach is non-obvious (complex conditionals, subtle logic)
     - Show the STRUCTURE, not complete implementation
     - Include inline comments explaining WHY, not WHAT

   **Example of minimal guidance**:

   ```
   **File**: src/codegen/generators/typescript/payloads.ts
   **Change**: Add a new optional config field and thread it into the Core function
   **Key notes**:
   - Add the field to `zodTypeScriptPayloadGenerator` with a `.default()` value
   - Object-parameter convention: pass it via the destructured options object (see code-style.mdc)
   - Thread it through `generateTypescriptPayloadsCore` without breaking existing defaults
   - Regenerate `schemas/` + docs with `npm run generate:assets`
   - Update snapshot tests in test/codegen/generators/
   ```

   **When to include code sketch**:

   ```typescript
   // Only show structure for complex/subtle logic:
   switch (inputType) {
     case 'asyncapi':
       // delegate to inputs/asyncapi processor then Core
       // WHY: each input type produces Processed*SchemaData differently
       break;
     case 'openapi':
     case 'jsonschema':
       // ...
       break;
   }
   ```

1. **Track Progress**:

   - Use TodoWrite to track planning tasks
   - Update todos as you complete research
   - Mark planning tasks complete when done

1. **When to Stop and Ask**:

   You should work autonomously as much as possible, but stop and ask when:

   - Files or components referenced in the issue/requirements don't exist
   - Requirements directly contradict each other or existing code patterns
   - You need design decisions that only the user can make
   - Multiple valid implementation approaches exist with significantly different trade-offs
   - Your proposed implementation would break established codebase patterns
   - After thorough research, you still can't resolve a critical technical uncertainty
   - A change would affect generated output in ways that constitute a breaking change

   When blocked, present the issue clearly with your research findings and specific options. Don't proceed with unresolved blockers, but also don't stop for things you can research or infer from the codebase.

1. **No Open Questions in Final Plan**:
   - If you encounter open questions during planning, STOP
   - Research or ask for clarification immediately
   - Do NOT write the plan with unresolved questions
   - The implementation plan must be complete and actionable
   - Every decision must be made before finalizing the plan

## Common Patterns

> These mirror the repo's existing skills — prefer running `add-generator`, `add-input-type`, or `add-protocol` for the canonical step-by-step workflow, and consult the matching `.cursor/rules/*.mdc` specs.

### For a New Generator:

- Follow the fixed generator shape (see `generators.mdc`): a `zodTypeScript<Name>Generator` Zod schema (`id`, `preset`, `outputPath`, `language`, `.default()` on every optional), a `z.input<>` external type and `z.infer<>` internal type, a `generateTypescript<Name>Core` function, and a `generateTypescript<Name>` entry that switches on `inputType`
- Register the generator in `src/codegen/types.ts` (the Zod discriminated union keyed on `preset`) and wire it in `src/codegen/generators/typescript/index.ts`
- Add the input-processing bridge in `src/codegen/inputs/<type>/generators/` if the generator needs processed data
- "Expected Output First": write the desired generated output + test in `test/runtime/typescript/` first
- Write unit tests with snapshot verification in `test/codegen/generators/`
- Add blackbox coverage (`test/blackbox/`) and runtime tests (`test/runtime/typescript/`)
- Add an example in `examples/` (REQUIRED)
- Add documentation in `docs/generators/` (REQUIRED)
- Regenerate `schemas/` + docs with `npm run generate:assets`

### For a New Protocol:

- Follow `protocols.mdc`. Create `src/codegen/generators/typescript/channels/protocols/<protocol>/` with publish/subscribe/request/reply files as the protocol supports
- Wire the protocol into the channels dispatch (`channels/index.ts`, `channels/asyncapi.ts` / `channels/openapi.ts`)
- Respect protocol constraints (e.g. MQTT requires v5 for user properties and must topic-filter incoming messages)
- Add runtime tests against the broker in `test/runtime/typescript/` (docker compose files exist for NATS, Kafka, MQTT, AMQP)
- Add an example in `examples/` and documentation in `docs/protocols/` (REQUIRED)

### For a New Input Type:

- Follow `inputs.mdc` and the `add-input-type` skill. Create `src/codegen/inputs/<type>/` with a `parser.ts` (parse + normalize + `$ref` resolution) and a `generators/` layer producing `Processed*SchemaData`
- Wire detection in `src/codegen/detection.ts` and dispatch in `src/codegen/inputs/index.ts`
- Add the `inputType` branch in each affected `generateTypescript<Name>` entry function
- Add unit tests in `test/codegen/inputs/`, runtime tests in `test/runtime/typescript/`
- Add documentation in `docs/inputs/` and an example in `examples/` (REQUIRED)

### For Modifying a Generator's Zod Config:

- Add/modify fields in the generator's `zodTypeScript<Name>Generator` schema — every optional field needs a `.default()`
- Thread the new option through the Core function via the destructured options object (object-parameter convention)
- Zod is the single source of truth: regenerate `schemas/` and command docs with `npm run generate:assets` — never hand-edit files in `schemas/`
- Update snapshot tests and add runtime coverage if output changes
- Update docs in `docs/generators/` and an example if user-facing (REQUIRED)

### For Custom Generator Changes:

- Work in `src/codegen/generators/generic/custom.ts`
- Preserve the user-facing contract for user-defined generators
- Add unit tests in `test/codegen/generators/` and update docs in `docs/generators/`

### For Refactoring:

- Document current behavior with existing tests
- Plan incremental changes
- Maintain backward compatibility in public config and generated output
- Review snapshot changes carefully
- Run runtime tests to verify generated code still works (semantically correct)
- Update documentation if user-facing behavior changes (REQUIRED)
- Update examples if config surface changes (REQUIRED)

## Sub-task Spawning Best Practices

When spawning research sub-tasks:

1. **Spawn multiple tasks in parallel** for efficiency
2. **Each task should be focused** on a specific area
3. **Provide detailed instructions** including:
   - Exactly what to search for
   - Which directories to focus on
   - What information to extract
   - Expected output format
4. **Be specific about directories**:
   - Generator code: `src/codegen/generators/typescript/`
   - Protocol channels: `src/codegen/generators/typescript/channels/protocols/<protocol>/`
   - Client code: `src/codegen/generators/typescript/client/`
   - Custom generators: `src/codegen/generators/generic/custom.ts`
   - Input processing: `src/codegen/inputs/{asyncapi,openapi,jsonschema}/`
   - Types/config: `src/codegen/types.ts`, `src/codegen/configurations.ts`, `src/codegen/renderer.ts`
   - Tests: `test/codegen/`, `test/blackbox/`, `test/runtime/typescript/`
   - Always use the exact directory path
5. **Specify read-only tools** to use
6. **Request specific file:line references** in responses
7. **Wait for all tasks to complete** before synthesizing
8. **Verify sub-task results**:
   - If a sub-task returns unexpected results, spawn follow-up tasks
   - Cross-check findings against the actual codebase
   - Don't accept results that seem incorrect

Example of spawning multiple tasks:

```
# Use the Task tool to spawn specialized agents concurrently:
- codegen-analyzer: "Analyze how the payloads generator threads config through generateTypescriptPayloadsCore in src/codegen/generators/typescript/payloads.ts"
- input-analyzer: "Find how the OpenAPI parser normalizes request/response schemas in src/codegen/inputs/openapi/"
- codebase-pattern-finder: "Find examples of protocol channel publish helpers in src/codegen/generators/typescript/channels/protocols/"
- codebase-locator: "Find all files related to output path handling across the TypeScript generators"
```

## Pattern Research for Planning

When researching during planning:

- Use codebase-pattern-finder to identify which patterns exist
- Document the reference files in the "Pattern Decisions" section
- Focus on IDENTIFYING patterns, not learning every detail
- The implementation agent will do deeper pattern research when actually writing code

**Example research for planning**:

```
Agent: codebase-pattern-finder
Prompt: "Find a TypeScript generator that adds an optional boolean config field with a default and threads it through its Core function. I need to document which pattern to follow."
```

Result: Document in plan as "Generator config pattern: optional Zod field with `.default(false)` threaded through the Core options object (based on: src/codegen/generators/typescript/payloads.ts)"
