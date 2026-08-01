---
name: add-protocol
description: Step-by-step workflow for adding a new messaging protocol to the channels generator
---

# Add a New Protocol

Follow these steps to add `$ARGUMENTS` protocol support:

## Phase 1: Design Expected Output

1. Manually create expected channel functions in `test/runtime/typescript/src/`
2. Write runtime tests in `test/runtime/typescript/test/channels/`
3. All callbacks MUST use object parameters: `(params: {err?, msg?, parameters?, headers?, protocolMsg?}) => void`
4. Validate manual implementation passes tests

## Phase 2: Infrastructure

5. Create Docker Compose file: `test/runtime/docker-compose-$ARGUMENTS.yml`
6. Add npm scripts in root `package.json`:
   - `runtime:$ARGUMENTS:start`
   - `runtime:$ARGUMENTS:stop`

## Phase 3: Implementation

7. Create protocol directory: `src/codegen/generators/typescript/channels/protocols/$ARGUMENTS/`
8. Implement operations: `publish.ts`, `subscribe.ts`, `request.ts`, `reply.ts` (as applicable)
9. All functions MUST use object parameters
10. Implement protocol-specific header handling

## Phase 4: Registration

11. Add function types to `ChannelFunctionTypes` enum in channel types
12. Add subscribe types to `receivingFunctionTypes` array

## Phase 5: Testing

13. Write runtime tests with Docker containers
14. Add blackbox test configurations
15. Verify all tests pass: `npm run prepare:pr`

## Phase 6: Downstream surfaces

The generator is not the only place that lists protocols. The CLI wizard, the
website and the MCP server each keep their own hand-maintained copy, none of
which is generated from the Zod schema. Miss one and the protocol ships but is
unreachable from that surface.

`test/protocol-surfaces.spec.ts` enforces this list — run it and let the failure
messages drive the work:

```bash
npm run build && npm test -- --testPathPattern=protocol-surfaces
```

16. `src/commands/init.ts` — add to `AsyncAPIChannelProtocolOptions` and/or
    `OpenAPIChannelProtocolOptions` depending on which inputs support it. This
    also gates the `--channels-protocols` flag, so re-run
    `npm run generate:commands` to refresh `docs/usage.md`.
17. `website/src/components/Playground/ConfigForm.tsx` — the `PROTOCOLS` picker.
18. `website/src/utils/configCodegen.ts` — `PROTOCOL_INPUT_COMPATIBILITY`. The
    picker filters on this, so an entry missing here hides the option entirely.
19. `website/src/components/Home/Protocols/index.tsx` — the homepage marquee.
19b. `website/src/components/Home/demos.ts` — the homepage showcase. Read that
    file's header comment first: every snippet must be real generator output for
    the demo's *own* embedded spec, and the hand-written `index.ts` pane must
    compile against it. Extract the spec, run the CLI on it, paste verbatim
    (eliding long bodies with `// ...`) — never adapt a snippet from another
    document or write one from memory.
20. `mcp-server/lib/data/generators.ts` — add to `protocolValues` (every MCP tool
    schema derives its `z.enum` from it), plus `protocolDescriptions` and
    `clientImports` in `lib/tools/integration-tools.ts` — both are
    `Record<Protocol, …>`, so `tsc` will name them if you forget. Add a usage
    example to `lib/data/examples.ts`.
21. Docs: a `docs/protocols/<name>.md` page, plus the protocol lists in
    `README.md`, `docs/README.md`, `docs/getting-started/protocols.md`,
    `docs/generators/channels.md` and `docs/generators/README.md`. Follow the
    `write-docs` skill — the page is for a reader with a task, not a summary of
    the PR that built it.
22. An `examples/` project, per "no feature without docs + an example".

Do **not** hand-edit `website/src/schemas/configuration-schema.json`,
`website/static/codegen.browser.mjs` or `mcp-server/lib/resources/bundled-docs.ts`.
They are generated copies, refreshed by `generate:playground` /
`generate:mcp:docs` in the release pipeline rather than in feature PRs.
