# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@the-codegen-project/cli` — an oclif-based CLI (binary name `codegen`) that reads API specification documents (AsyncAPI v2/v3, OpenAPI 2.0/3.0/3.1 + Swagger, JSON Schema Draft 4/6/7) and generates TypeScript code: payload/message models, parameter models, header models, general types, protocol channel helpers (NATS, Kafka, MQTT, AMQP, EventSource, HTTP client, WebSocket), and full clients. It is a standalone repo that happens to live inside the `platform-and-services` monorepo — it uses **npm** (not the monorepo's pnpm) and requires **Node.js 22+**.

## Commands

This project uses `npm`. Run all commands from this directory (`cli/`), not the monorepo root.

```bash
npm run build            # rimraf dist && tsc && oclif manifest
npm run dev              # tsc --watch
npm run lint             # eslint (max-warnings 0) + typecheck:test — must pass clean
npm run lint:fix         # autofix + typecheck:test
npm run format           # prettier --write on src/**/*.ts
npm test                 # jest with coverage (excludes test/blackbox)
npm run typecheck        # tsc --noEmit

# Run a single test file / pattern
npm test -- --testPathPattern=test/codegen/generators/payloads
npm test -- --testNamePattern="payloads.*asyncapi"
npm test -- -u          # update snapshots (alias: npm run test:update)
```

**MANDATORY before considering any task complete**: run `npm run prepare:pr` (build → generate:assets → lint:fix → test:update → regenerate runtime). It is the project's quality gate — do not mark work done until it passes. See `.cursor/rules/task-completion.mdc`.

`generate:assets` regenerates the README table of contents, the command docs under `docs/`, and the JSON schemas in `schemas/` from the Zod schemas (`scripts/generateSchemaFiles.js`). When you change a generator's Zod schema, these must be regenerated.

## Three-tier testing

Correctness is validated at three levels — understand which tier a change needs:

1. **Unit** (`test/codegen/`) — logic and syntax of generator functions. Fast, snapshot-heavy. `npm test`.
2. **Blackbox** (`test/blackbox/`) — runs real config × input combinations and type-checks the generated output. Excluded from the default `npm test`; run via `npm run test:blackbox`.
3. **Runtime** (`test/runtime/typescript/`) — proves generated code works semantically against live message brokers in Docker. This project is also the **design surface**: per the "Expected Output First" philosophy, you manually write the desired output here and its tests *before* building the generator that produces it.

```bash
npm run runtime:services:start   # docker compose up NATS + Kafka + MQTT + AMQP
npm run runtime:typescript       # full runtime suite (links CLI, generates, tests)
npm run runtime:services:stop
```

## Architecture

CLI and library live in the **same package** under `src/`.

- **`src/commands/`** — oclif commands (`generate`, `init`, `telemetry`), all extending `base.ts`. `bin/run.mjs` is the entry point; oclif discovers commands from `dist/commands`.
- **`src/codegen/`** — the generation engine:
  - **`inputs/`** — parse + normalize documents into standardized `Processed*SchemaData` interfaces. One subdir per input type: `asyncapi/`, `openapi/`, `jsonschema/`. Core generators are input-agnostic and only see processed data, never raw documents.
  - **`generators/`** — language generators. `generators/typescript/` is the bulk; `generators/generic/custom.ts` runs user-defined generators. Protocol channel code lives under `generators/typescript/channels/protocols/<protocol>/`.
  - **`types.ts`** — central type definitions and the Zod discriminated unions (`zodAsyncAPITypeScriptGenerators`, `zodOpenAPITypeScriptGenerators`, etc.) keyed on the `preset` field. New generators must be registered here.
  - **`configurations.ts`** — loads the user config (JSON/YAML/ESM/CJS/TS via cosmiconfig) and validates it with Zod.
  - **`renderer.ts`** — orchestrates generators in dependency order via a `graphology` render graph.
- **`src/browser/`** — a separate browser bundle (built with esbuild via `esbuild.browser.mjs`, `npm run build:browser`) that runs generation in-memory in a web page. It shims Node-only deps (fs, parsers) under `browser/shims/`. Used by the playground/website.
- **`mcp-server/`** — an independent Next.js sub-app (its own `package.json`, `npm install` separately) exposing an MCP server.
- **`website/`** — docs/playground site.

### The generation flow

1. Load & validate the user's codegen config (Zod).
2. Parse the input document (`inputs/<type>/parser.ts`).
3. For each configured generator, run its input processor to produce `Processed*SchemaData`.
4. The renderer runs generators in dependency order; TypeScript generators wrap `@asyncapi/modelina`'s `TypeScriptFileGenerator` and write files with `generateToFiles()`.

## Conventions specific to this repo

The `.cursor/rules/*.mdc` files are the detailed, authoritative spec — read the relevant one before non-trivial work (`generators.mdc`, `inputs.mdc`, `protocols.mdc`, `modelina-presets.mdc`, `code-style.mdc`, `testing.mdc`). Highlights:

- **Object parameters are mandatory** for any function (and any *generated* function) with 2+ parameters — destructured object, explicit type, defaults in the destructure. Positional params only for single-arg / simple math / constructor-like helpers. This applies to callbacks in generated code too: `callback: (params: {error?: Error, data?: T}) => void`. See `code-style.mdc`.
- **Every generator** follows the fixed shape: a `zodTypeScript<Name>Generator` schema (with `id`, `preset`, `outputPath`, `language` + `.default()` on every optional field), a `z.input<>` external type and `z.infer<>` internal type, a `generateTypescript<Name>Core` function, and a `generateTypescript<Name>` entry that switches on `inputType`. See `generators.mdc`.
- **Zod is the single source of truth** for config; JSON schemas in `schemas/` are generated from it — never hand-edit generated schema files.
- Use `Logger` from `src/LoggingInterface.ts`, never `console.log`. Avoid `any` without justification, hardcoded paths, and sync file ops in generators.
- **MQTT channel code requires protocol v5** (user properties) and must topic-filter incoming messages — see `protocols.mdc`.
- Conventional commits (`feat:`, `fix:`, `docs:`, …); releases are automated via semantic-release (`.releaserc`).
- No feature without docs + an example: update `docs/`, add to `examples/`, regenerate `schemas/`.
