---
description: Code review for changed files against this repo's generator, input, protocol, and testing rules. Supports aspect arguments (code, generators, inputs, protocols, types, tests, docs, simplify, breaking).
argument-hint: "[aspects...] [path] [--skip <dir>]"
---

# Code Review

Review changed files against the conventions in `.claude/rules/*.md` and `.cursor/rules/*.mdc`, which are the authoritative spec for this repo.

## Aspects

| Aspect | Focus | Authoritative rule |
|--------|-------|--------------------|
| `code` | General quality, object params, `Logger` over `console.log`, no `any`, no sync file I/O | `.claude/rules/code-style.md` |
| `generators` | Generator shape: Zod schema, `z.input`/`z.infer` duality, `generateTypescript<Name>Core` + entry, registration in `types.ts` | `.claude/rules/generators.md` |
| `inputs` | Parsers and `Processed*SchemaData` normalization; generators must stay input-agnostic | `.claude/rules/inputs.md` |
| `protocols` | Channel code per protocol (MQTT v5 + topic filtering, etc.) | `.claude/rules/protocols.md` |
| `types` | Zod schemas, discriminated unions, `.default()` on optionals, generated `schemas/` in sync | `.cursor/rules/generators.mdc` |
| `tests` | Three-tier coverage: unit / blackbox / runtime | `.claude/rules/testing.md` |
| `docs` | Generated-asset drift: `docs/`, `schemas/`, `README` TOC, `examples/` | `CLAUDE.md` |
| `simplify` | Simplification and dead-code removal | `.claude/rules/code-style.md` |
| `breaking` | Changes that break *users*: generated output shape or config schema | see Step 5 |
| `all` | Auto-detect applicable aspects (default) | — |

Examples:
- `/review` — auto-detect from the diff
- `/review generators types` — only those two
- `/review src/codegen/inputs/openapi/` — scope to a path
- `/review --skip .claude` — exclude a directory

## Step 1: Determine files

Parse args: aspect names, an optional path, and any `--skip <dir>` exclusions.

With no path argument, use the branch diff:

```bash
git diff --name-only main
```

If that is empty, fall back to `git status --porcelain` for uncommitted work; if still empty, ask the user what to review.

Apply `--skip` filters. For code reviewers, include `.ts`, `.js`, `.json`, `.yml`, `.yaml`; exclude `dist/`, `test/runtime/typescript/src/` (generated), and `__snapshots__/`. Keep the *unfiltered* list for auto-detection — snapshot and generated-file churn is itself a signal.

## Step 2: Auto-detect aspects

When no aspects are given, derive them from the changed paths:

| Changed path | Aspects |
|---|---|
| `src/codegen/generators/**` | `generators`, `code`, `types` |
| `src/codegen/generators/typescript/channels/protocols/**` | + `protocols` |
| `src/codegen/inputs/**` | `inputs`, `code` |
| `src/codegen/types.ts`, `src/codegen/configurations.ts` | `types`, `breaking` |
| `src/commands/**`, `src/browser/**` | `code` |
| `test/**` | `tests` |
| `schemas/**`, `docs/**`, `examples/**` | `docs` (these are generated — verify they were regenerated, not hand-edited) |
| any snapshot churn in `__snapshots__/` | `breaking` (generated output changed) |

Always add `code`. Add `tests` whenever `src/` changed — new behaviour needs a tier.

## Step 3: Context (skip for trivial diffs)

Spawn in parallel, one message:

- `codebase-locator` — "Find all call sites of the functions/exports changed in {files}."
- `codebase-pattern-finder` — "Find existing implementations similar to {summary}, so the new code can match them."
- `thoughts-locator` — "Find research/plans in `.claude/thoughts/shared/` related to {changed area or branch name}."

Wait for all before continuing.

## Step 4: Review

Spawn all applicable reviewers **in parallel in a single message**. This repo has no dedicated reviewer subagents — use the analyzers where they fit and `general-purpose` otherwise, each told to read its rule file first:

- `generators` → `codegen-analyzer`
- `inputs` → `input-analyzer`
- everything else → `general-purpose`

Prompt shape:

```
Read .claude/rules/{rule}.md. Review these changed files for compliance:
{file list}

Report findings as: severity (critical/important/suggestion), file:line, what's
wrong, and the concrete fix. Cite the rule you're applying. Do not report style
nits the linter already catches — `npm run lint` runs with --max-warnings 0.
```

For `docs`, verify the generated assets match their sources rather than reading them for prose: a changed Zod schema requires a regenerated `schemas/` file, a changed command requires regenerated `docs/`.

## Step 5: Breaking changes

Run when `src/codegen/types.ts`, `src/codegen/configurations.ts`, a generator's Zod schema, or generated-output snapshots changed. Two distinct kinds:

1. **Config breaks** — a renamed/removed/newly-required config field, a changed `preset` discriminator, or a removed `.default()`. Every existing user config that used it now fails Zod validation.
2. **Generated-output breaks** — the emitted TypeScript changes shape (renamed export, changed function signature, changed serialization). Users' code compiled against the old output stops compiling. Snapshot diffs in `test/codegen/**/__snapshots__/` are the primary evidence.

For each, state whether it is additive (safe), whether a default preserves old behaviour, and whether it needs a `feat!:`/`BREAKING CHANGE:` commit footer — semantic-release derives the major bump from that.

## Step 6: Report

Present inline. No report files.

```markdown
# Review — {branch}

{n} files reviewed · aspects: {list}

## Critical (must fix)
- [{aspect}] {file}:{line} — {issue} → {fix}

## Important (should fix)
- [{aspect}] {file}:{line} — {issue} → {fix}

## Suggestions
- [{aspect}] {file}:{line} — {suggestion}

## Breaking changes
- {config | output} — {what changed} — {additive? default? needs BREAKING CHANGE footer?}
- or "None."

## Test coverage
- Unit / blackbox / runtime: what's covered, what's missing and which tier it belongs in.

## Strengths
- {what's done well}

## Next
1. Fix critical, then important.
2. `npm run prepare:pr` — the mandatory gate.
3. Re-run `/review` to verify.
```

Report "no issues found" per empty category rather than dropping the heading. If a reviewer fails, say so and name the files it left uncovered — never present a partial review as complete.
