# The Codegen Project CLI

Code generator CLI that takes input documents (AsyncAPI, OpenAPI, JSON Schema) and generates TypeScript code: payload models, parameter models, header models, and communication functions for message brokers (NATS, Kafka, MQTT, AMQP) and HTTP APIs.

## Project Structure

- `src/commands/` - CLI commands (oclif framework)
- `src/codegen/generators/` - Code generators by language (TypeScript)
- `src/codegen/inputs/` - Input processing (AsyncAPI, OpenAPI)
- `src/codegen/types.ts` - Core type definitions and Zod schemas
- `src/codegen/configurations.ts` - Configuration management
- `src/codegen/renderer.ts` - Rendering orchestration
- `test/blackbox/` - Syntax testing (generated code compiles)
- `test/runtime/` - Semantic testing (generated code works correctly)
- `examples/` - Showcase projects

## Key Commands

```bash
npm run build              # Build project
npm run prepare:pr         # MANDATORY before completing any task (build + format + lint + test)
npm test                   # Run unit tests
npm run test:update        # Update snapshots and run tests
npm run format             # Format code
npm run lint:fix           # Fix linting issues
npm run generate:schema    # Generate JSON schemas from Zod
npm run dev                # Watch mode
npm run runtime:services:start   # Start Docker containers for protocol tests
npm run runtime:services:stop    # Stop Docker containers
```

## Core Conventions

- **Object parameters**: Functions with 2+ params MUST use object destructuring (see rules/code-style.md)
- **Zod schemas**: Every generator must have a Zod schema with `.default()` on optionals
- **Type duality**: Use `z.input<>` for external types, `z.infer<>` for internal types
- **No `any`** without justification, no `console.log` (use `Logger`), no sync file I/O
- **Conventional commits**: `feat:`, `fix:`, `docs:`, etc.
- **Three-tier testing**: Unit tests, blackbox (syntax), runtime (semantic)
- **Expected output first**: Manually create expected output before building generators
- **Always run `npm run prepare:pr`** before considering any task complete
