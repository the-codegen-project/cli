# Variable: zodAsyncAPICodegenConfiguration

> `const` **zodAsyncAPICodegenConfiguration**: `ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>

## Type declaration

### $schema

> **$schema**: `ZodOptional`\<`ZodString`\>

### generators

> **generators**: `ZodArray`\<`ZodUnion`\<[`ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>, `ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>, `ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>, `ZodObject`\<`object`, `"strip"`, `ZodTypeAny`, `object`, `object`\>]\>, `"many"`\>

### inputPath

> **inputPath**: `ZodString`

### inputType

> **inputType**: `ZodLiteral`\<`"asyncapi"`\>

### language

> **language**: `ZodOptional`\<`ZodEnum`\<[`"typescript"`]\>\>

## Defined in

[src/codegen/types.ts:64](https://github.com/the-codegen-project/cli/blob/fb2e06aa486fbabbf4d0491440fd86ae2bc7f2f8/src/codegen/types.ts#L64)
