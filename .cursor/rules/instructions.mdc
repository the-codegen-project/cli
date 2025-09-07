# Cursor Instructions for The Codegen Project CLI

## Quick Start Checklist

### Before You Start
- [ ] Read the project overview in `rules.mdx`
- [ ] Understand the three-tier testing approach
- [ ] Familiarize yourself with existing generators in `src/codegen/generators/typescript/`
- [ ] Check the examples in `examples/` directory

## Development Philosophy: Expected Output First

**CORE PRINCIPLE**: Always start with the expected generated output before building generators!

### Runtime Project as Design Tool
The `test/runtime/typescript/` project serves as both:
- **Design Specification**: Where you manually create the expected output
- **Validation Environment**: Where you test that generated code works correctly
- **Reference Implementation**: The source of truth for what generators should produce

### Workflow Overview
1. **Design Phase**: Manually implement expected output in runtime project
2. **Validation Phase**: Create tests that validate the manual implementation
3. **Generation Phase**: Build generators that produce the same output
4. **Verification Phase**: Ensure generated code passes the same tests

## Step-by-Step Workflows

### 🔧 Adding a New Generator (Expected Output First Approach)

**CRITICAL**: Always start with the expected generated output before building generators!

#### Phase 1: Define Expected Output in Runtime Project

1. **Manual Implementation in Runtime Project**
   ```bash
   cd test/runtime/typescript/src/
   # Manually create the expected generated files
   # Example: Create a single function/class that represents the desired output
   ```

2. **Create/Adapt Runtime Tests**
   ```typescript
   // In test/runtime/typescript/test/[feature].spec.ts
   describe('Generated [Feature] Code', () => {
     test('should work as expected', () => {
       // Test the manually created expected output
       // This defines the contract for what the generator should produce
     });
   });
   ```

3. **Validate Expected Output**
   ```bash
   cd test/runtime/typescript
   npm test -- --testNamePattern="[feature]"
   # Ensure your manually created output works correctly
   ```

4. **Document Expected Behavior**
   - Document what the generated code should do
   - Document the API surface (function signatures, class interfaces)
   - Document any dependencies or imports needed
   - Note any specific patterns or conventions

#### Phase 2: Build Generator to Match Expected Output

5. **Create the Zod Schema**
   ```typescript
   // In src/codegen/generators/typescript/[name].ts
   export const zodTypeScript[Name]Generator = z.object({
     id: z.string().optional().default('[name]-typescript'),
     preset: z.literal('[name]').default('[name]'),
     outputPath: z.string().optional().default('src/__gen__/[name]'),
     language: z.literal('typescript').optional().default('typescript'),
     // Add specific options that control the expected output
   });
   ```

6. **Register in Types**
   - Add to `zodAsyncAPITypeScriptGenerators` in `src/codegen/types.ts`
   - Add to `zodOpenAPITypeScriptGenerators` if supporting OpenAPI

7. **Implement Generator to Match Expected Output**
   ```typescript
   export async function generateTypescript[Name]Core(
     processedData: Processed[Name]Data,
     generator: TypeScript[Name]GeneratorInternal
   ): Promise<TypeScript[Name]RenderType> {
     // Generate code that matches your manually created expected output
     // Use the runtime tests as the specification
   }
   ```

8. **Add Input Processors**
   - Create `src/codegen/inputs/asyncapi/generators/[name].ts`
   - Create `src/codegen/inputs/openapi/generators/[name].ts` (if needed)
   - Process input to extract data needed for expected output

#### Phase 3: Validate Generator Output

9. **Test Generator Against Expected Output**
   ```bash
   cd test/runtime/typescript
   npm run generate  # Run the actual generator
   npm test          # Should pass with generated code
   ```

10. **Compare Generated vs Manual**
    - Compare generated files with your manual implementation
    - Ensure generated code produces same test results
    - Refine generator until output matches expectations

11. **Add Comprehensive Tests**
    - Add unit tests in `test/codegen/generators/`
    - Add blackbox config in `test/blackbox/configs/typescript/`
    - Ensure all three test tiers pass

12. **Update Documentation**
    - Add to `docs/generators/[name].md`
    - Add example in `examples/`
    - Update JSON schema in `schemas/`

#### Key Principles

- **Expected Output First**: Never build a generator without knowing what it should produce
- **Runtime Tests as Specification**: The runtime tests define the contract
- **Manual Validation**: Always manually verify the expected output works
- **Iterative Refinement**: Compare generated output with manual implementation
- **Test-Driven**: Use tests to validate both manual and generated code

### 📥 Adding New Input Type Support

1. **Create Parser**
   ```typescript
   // In src/codegen/inputs/[type]/parser.ts
   export async function load[Type]Document(filePath: string): Promise<[Type]Document> {
     // Implementation
   }
   ```

2. **Add Generator Processors**
   - Create directory `src/codegen/inputs/[type]/generators/`
   - Implement processors for each generator type
   - Return standardized `Processed[Name]SchemaData` interfaces

3. **Update Type Definitions**
   - Add document type to `RunGeneratorContext` in `src/codegen/types.ts`
   - Create Zod configuration schema

4. **Add Tests**
   - Add test schemas in `test/blackbox/schemas/[type]/`
   - Update blackbox tests to include new input type

### 🧪 Testing Strategy

#### Unit Tests (`test/codegen/`)
```bash
# Run specific unit tests
npm test -- --testPathPattern=test/codegen/generators/payloads

# Run with coverage
npm test -- --coverage
```

#### Blackbox Tests (`test/blackbox/`)
```bash
# Run blackbox tests
npm test -- --testPathPattern=test/blackbox/typescript.spec.ts

# Run specific config/schema combination
npm test -- --testPathPattern=blackbox --testNamePattern="payloads.*asyncapi"
```

#### Runtime Tests (`test/runtime/`)
```bash
# Start all protocol services (Docker containers)
npm run runtime:services:start

# Run full runtime test suite
npm run runtime:typescript

# Run runtime tests manually
cd test/runtime/typescript && npm test

# Run specific protocol tests
cd test/runtime/typescript && npm run test:nats
cd test/runtime/typescript && npm run test:kafka
cd test/runtime/typescript && npm run test:mqtt
cd test/runtime/typescript && npm run test:amqp

# Stop all protocol services
npm run runtime:services:stop
```

### 🐛 Debugging Common Issues

#### Generator Not Found
- Check if added to discriminated union in `src/codegen/types.ts`
- Verify preset name matches exactly
- Ensure proper export in generator index file

#### Compilation Errors in Generated Code
- Check blackbox test output in `test/blackbox/output/`
- Verify Modelina configuration options
- Check TypeScript constraints and presets

#### Runtime Test Failures
- Verify protocol dependencies in `test/runtime/typescript/package.json`
- Check Docker containers are running for protocol tests
- Validate generated function signatures match expected patterns

#### Configuration Validation Errors
- Check Zod schema defaults and required fields
- Verify configuration file format (ESM, CJS, JSON, YAML)
- Test with `codegen init` to generate valid config

### 📁 File Organization Patterns

```
src/codegen/generators/typescript/
├── [generator-name].ts          # Main generator implementation
├── index.ts                     # Barrel exports
└── utils.ts                     # Shared utilities

src/codegen/inputs/[input-type]/
├── parser.ts                    # Document parsing
├── generators/
│   ├── [generator-name].ts      # Input-specific processing
│   └── index.ts                 # Barrel exports
└── index.ts                     # Main exports

test/blackbox/
├── configs/typescript/          # Test configurations
├── schemas/[input-type]/        # Test input documents
└── projects/typescript/         # Base project template

examples/[use-case]/
├── codegen.config.js           # Configuration example
├── [input-file]                # Input document
└── src/generated/              # Generated code output
```

### 🔍 Code Review Checklist

#### MANDATORY: Before Completing ANY Task
- [ ] **ALWAYS run `npm run prepare:pr`** - This is MANDATORY before considering any task complete
- [ ] Verify all steps in `prepare:pr` pass (build, format, lint:fix, test:update)

#### Before Submitting PR
- [ ] All tests pass (`npm test`)
- [ ] Code builds successfully (`npm run build`)
- [ ] Documentation updated
- [ ] Examples added/updated
- [ ] JSON schemas updated
- [ ] Conventional commit messages used
- [ ] No linting errors (`npm run lint`)

#### Generator Implementation
- [ ] Zod schema with proper defaults
- [ ] Both input and internal types defined
- [ ] Core and main functions implemented
- [ ] Input processors for all supported types
- [ ] Proper error handling with context
- [ ] Modelina integration follows patterns

#### Testing Coverage
- [ ] Unit tests for all public functions
- [ ] Blackbox tests for syntax validation
- [ ] Runtime tests for semantic validation
- [ ] Edge cases covered
- [ ] Error scenarios tested

### 🚀 Performance Optimization Tips

- Use `generateToFiles()` instead of `generate()` for better performance
- Cache parsed documents when processing multiple generators
- Avoid loading large files entirely into memory
- Use streaming for large input processing
- Leverage Modelina's dependency management

### 🔧 Development Tools

```bash
# Watch mode for development
npm run dev

# Generate JSON schemas from Zod
npm run generate:schema

# Update documentation
npm run generate:assets

# Format code
npm run format

# Lint and fix
npm run lint:fix
```

### 📚 Learning Resources

- **Modelina Documentation**: https://github.com/asyncapi/modelina
- **Zod Documentation**: https://zod.dev/
- **AsyncAPI Parser**: https://github.com/asyncapi/parser-js
- **Project Examples**: Check `examples/` directory
- **Architecture Decisions**: See `docs/architectural-decisions/`

### 🆘 Getting Help

1. **Check Existing Code**: Look at similar generators for patterns
2. **Review Tests**: Understand expected behavior from test cases
3. **Documentation**: Check `docs/` directory for detailed guides
4. **Examples**: See working implementations in `examples/`
5. **Issues**: Create GitHub issue with detailed reproduction steps
