---
paths:
  - "src/codegen/generators/**/*.ts"
---

# Generator Implementation Rules

## Required Structure

Every generator must follow this pattern:

```typescript
// 1. Zod schema with defaults
export const zodTypeScript[Name]Generator = z.object({
  id: z.string().optional().default('[name]-typescript'),
  preset: z.literal('[name]').default('[name]'),
  outputPath: z.string().optional().default('src/__gen__/[name]'),
  language: z.literal('typescript').optional().default('typescript'),
});

// 2. Both type variants
export type TypeScript[Name]Generator = z.input<typeof zodTypeScript[Name]Generator>;
export type TypeScript[Name]GeneratorInternal = z.infer<typeof zodTypeScript[Name]Generator>;

// 3. Context interface
export interface TypeScript[Name]Context extends GenericCodegenContext {
  inputType: 'asyncapi' | 'openapi';
  asyncapiDocument?: AsyncAPIDocumentInterface;
  openapiDocument?: OpenAPIV3.Document | OpenAPIV2.Document | OpenAPIV3_1.Document;
  generator: TypeScript[Name]GeneratorInternal;
}

// 4. Core function (works with processed data)
export async function generateTypescript[Name]Core(
  processedData: Processed[Name]Data,
  generator: TypeScript[Name]GeneratorInternal
): Promise<TypeScript[Name]RenderType> { }

// 5. Main function (handles input type switching)
export async function generateTypescript[Name](
  context: TypeScript[Name]Context
): Promise<TypeScript[Name]RenderType> { }
```

Register new schemas in `src/codegen/types.ts` discriminated unions.

## Modelina Integration

- Always use `generateToFiles()` for performance
- Use `{exportType: 'named'}` for consistent exports
- Base config: `defaultCodegenTypescriptModelinaOptions`

```typescript
const modelinaGenerator = new TypeScriptFileGenerator({
  ...defaultCodegenTypescriptModelinaOptions,
  presets: [
    TS_DESCRIPTION_PRESET,                                    // Base first
    { preset: TS_COMMON_PRESET, options: { marshalling: true } },
    customPresets,                                             // Custom after
  ],
});
```

## Modelina Presets

Presets are stackable middleware layers. **Order matters** - applied in array order.

Methods: `self`, `ctor`, `property`, `getter`, `setter`, `additionalContent` (class); `self`, `item` (enum); `self` (type).

- Place foundational presets first (TS_COMMON_PRESET)
- Check model types before customization (ConstrainedUnionModel, etc.)
- Avoid fragile string replacements on content
- Handle multiple concerns in a single preset to avoid location conflicts

## Error Handling

```typescript
if (!asyncapiDocument) {
  throw new Error('Expected AsyncAPI input, was not given');
}
if (!schemaData.schema) {
  Logger.warn(`No schema found for ${itemName}, skipping generation`);
  continue;
}
```

## Required Imports

```typescript
import {z} from 'zod';
import {TypeScriptFileGenerator, OutputModel} from '@asyncapi/modelina';
import {defaultCodegenTypescriptModelinaOptions} from './utils';
import {Logger} from '../../../LoggingInterface';
```

## Output Convention

Default output path: `src/__gen__/[generator-type]/` with barrel exports in `index.ts`.
