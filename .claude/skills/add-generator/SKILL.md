---
name: add-generator
description: Step-by-step workflow for adding a new code generator
---

# Add a New Generator

Follow these steps to add a new generator called `$ARGUMENTS`:

## Phase 1: Design Expected Output

1. Create expected output manually in `test/runtime/typescript/src/`
2. Write runtime tests in `test/runtime/typescript/test/` that validate the expected output
3. Validate the manual implementation passes tests: `cd test/runtime/typescript && npm test`

## Phase 2: Implement Generator

4. Create Zod schema in `src/codegen/generators/typescript/$ARGUMENTS.ts`:
   - Include `id`, `preset`, `outputPath`, `language` fields with defaults
   - Export both `z.input<>` and `z.infer<>` types
   - Create context interface extending `GenericCodegenContext`

5. Register in `src/codegen/types.ts`:
   - Add to `zodAsyncAPITypeScriptGenerators` discriminated union
   - Add to `zodOpenAPITypeScriptGenerators` if supporting OpenAPI

6. Implement core generator function (`generateTypescript[Name]Core`)
7. Implement main generator function with input type switch (`generateTypescript[Name]`)

## Phase 3: Input Processors

8. Create `src/codegen/inputs/asyncapi/generators/$ARGUMENTS.ts`
9. Create `src/codegen/inputs/openapi/generators/$ARGUMENTS.ts` (if needed)
10. Update barrel exports in `index.ts` files

## Phase 4: Testing

11. Add blackbox config in `test/blackbox/configs/typescript/`
12. Add unit tests
13. Verify generated code matches manual implementation

## Phase 5: Documentation

14. Update `docs/generators/`
15. Add example in `examples/`
16. Update JSON schemas: `npm run generate:schema`

## Phase 6: Validate

17. Run `npm run prepare:pr` and fix any issues
