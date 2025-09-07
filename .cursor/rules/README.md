# Cursor Rules Overview

This directory contains the development rules and guidelines for The Codegen Project CLI. These rules ensure consistency, quality, and maintainability across the entire codebase.

## Rule Files

### Core Rules
- **`core.mdc`** - Project overview, architecture, and fundamental principles
- **`code-style.mdc`** - **NEW**: Code style patterns, especially object parameters requirement
- **`quality.mdc`** - Code quality standards, type safety, and performance requirements

### Implementation Rules
- **`generators.mdc`** - Generator implementation patterns and object parameter requirements
- **`inputs.mdc`** - Input processing rules for AsyncAPI and OpenAPI
- **`modelina-presets.mdc`** - Modelina preset development guidelines

### Testing Rules
- **`testing.mdc`** - Three-tier testing approach with object parameter test patterns
- **`task-completion.mdc`** - Mandatory task completion requirements (prepare:pr)

### Operational Rules
- **`terminal.mdc`** - Terminal command execution patterns
- **`instructions.mdc`** - General development instructions

## Key Changes: Object Parameters Requirement

### **MANDATORY: Object Parameters for Multi-Parameter Functions**

All new code and generated code MUST use object parameters for functions with 2+ parameters:

```typescript
// ✅ REQUIRED
callback: (params: {error?: Error, data?: SomeType}) => void
callback({error: undefined, data: result});

// ❌ FORBIDDEN  
callback: (error?: Error, data?: SomeType) => void
callback(undefined, result);
```

### Where This Rule Applies

1. **Generated Code** (`generators.mdc`):
   - All callback functions in generated protocol code
   - Multi-parameter function signatures
   - Function invocations

2. **Test Code** (`testing.mdc`):
   - Runtime test callbacks for all protocols
   - EventSource, AMQP, Kafka, NATS test patterns

3. **Internal Code** (`code-style.mdc`):
   - Generator implementation functions
   - Utility functions with multiple parameters
   - API functions

4. **Quality Standards** (`quality.mdc`):
   - Enforced as a code quality requirement
   - Listed in forbidden patterns

## Rule Hierarchy

```
core.mdc (foundational principles)
├── code-style.mdc (object parameters, naming conventions)
├── quality.mdc (quality standards, includes code-style reference)
├── generators.mdc (generator patterns, includes object parameters)
├── testing.mdc (test patterns, includes object parameter tests)
├── inputs.mdc (input processing)
├── modelina-presets.mdc (preset development)
└── task-completion.mdc (completion requirements)
```

## Enforcement

- **Code Reviews**: All PRs must follow object parameter patterns
- **Testing**: Tests must use object parameter callbacks
- **Generation**: All generators must produce object parameter code
- **Quality Gates**: `prepare:pr` script enforces these standards

## Migration Strategy

When updating existing code:

1. **Update function signatures** to use object parameters
2. **Update all function calls** to use object syntax  
3. **Update tests** to match new patterns
4. **Regenerate code** if generator-produced
5. **Run `prepare:pr`** to verify compliance

## Benefits

- **Maintainability**: Easy to add parameters without breaking changes
- **Readability**: Self-documenting parameter names at call sites
- **Type Safety**: Better TypeScript intellisense and validation
- **Consistency**: Uniform patterns across the entire codebase
