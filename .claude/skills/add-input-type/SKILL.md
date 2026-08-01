---
name: add-input-type
description: Step-by-step workflow for adding a new input type (e.g., GraphQL, Protobuf)
---

# Add a New Input Type

Follow these steps to add support for `$ARGUMENTS` as an input type:

## Phase 1: Parser

1. Create parser in `src/codegen/inputs/$ARGUMENTS/parser.ts`
2. Implement document loading and validation

## Phase 2: Generator Processors

3. Create directory `src/codegen/inputs/$ARGUMENTS/generators/`
4. Implement processors for each generator type (payloads, parameters, headers, types)
5. Each processor must return standardized `ProcessedXSchemaData` interfaces
6. Create barrel exports in `index.ts`

## Phase 3: Type Integration

7. Update `RunGeneratorContext` in `src/codegen/types.ts` to include new document type
8. Create Zod configuration schema for the new input type
9. Update configuration management in `src/codegen/configurations.ts`

## Phase 4: Testing

10. Add test schemas in `test/blackbox/schemas/$ARGUMENTS/`
11. Update blackbox tests to include new input type
12. Add unit tests for parser and processors

## Phase 5: Documentation

13. Update documentation in `docs/`
14. Add examples in `examples/`

## Phase 6: Validate

15. Run `npm run prepare:pr` and fix any issues
