---
paths:
  - "src/**/*.ts"
  - "test/**/*.ts"
---

# Code Style Rules

## Object Parameters (MANDATORY)

Functions with 2+ parameters MUST use object destructuring:

```typescript
// REQUIRED
function processMessage({message, headers, options}: {
  message: MessageType;
  headers?: HeaderType;
  options: ProcessOptions;
}) { }

// REQUIRED for callbacks
callback: (params: {error?: Error, data?: SomeType}) => void

// Exceptions: single-param functions, simple utilities like pascalCase(str)
```

Generated code MUST also follow this pattern:
```typescript
const callbackType = `callback: (params: {${parameterList}}) => void`;
const functionCall = `callback({error: undefined, data: result});`;
```

## TypeScript Conventions

- Strict TypeScript configuration
- Explicit return types on all functions
- `interface` for object shapes, `type` for unions/computed types
- `const` assertions for immutable data

## Naming

- Types: PascalCase
- Variables/functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Generator files: `[preset-name].ts`
- Prefer full words: `message` not `msg`, `headers` not `hdrs`, `callback` not `cb`

## Forbidden Patterns

- No `any` types without justification in comments
- No `console.log` - use `Logger` from `LoggingInterface.ts`
- No hardcoded paths - use configuration or constants
- No synchronous file operations
- No global variables
- No `require()` - use ES6 imports
- No `eval()` or `Function()`
- No circular dependencies
