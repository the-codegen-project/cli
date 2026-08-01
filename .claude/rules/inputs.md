---
paths:
  - "src/codegen/inputs/**/*.ts"
---

# Input Processing Rules

## Required Interface

Input processors must return standardized interfaces:

```typescript
export interface Processed[Name]SchemaData {
  channelPayloads: Record<string, {schema: any; schemaId: string}>;
  operationPayloads: Record<string, {schema: any; schemaId: string}>;
  otherPayloads: {schema: any; schemaId: string}[];
}
```

## File Organization

```
src/codegen/inputs/
├── asyncapi/
│   ├── parser.ts
│   └── generators/         # One file per generator type
│       ├── payloads.ts
│       ├── parameters.ts
│       ├── headers.ts
│       ├── types.ts
│       └── index.ts
├── openapi/                # Same structure
```

## Key Principles

- Input processors extract schemas and return standardized `ProcessedXSchemaData`
- Core generators work with processed data, NOT raw input documents
- Always validate input documents exist before processing
- Support all OpenAPI versions (2.0, 3.0, 3.1) with proper type guards
- Use async processing for I/O operations
- Warn and skip missing schemas with `Logger.warn()`
- Include document type and item names in error messages

## Required Imports

```typescript
import {AsyncAPIDocumentInterface} from '@asyncapi/parser';
import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';
import {Logger} from '../../../LoggingInterface';
import {pascalCase} from '../../generators/typescript/utils';
```

## Forbidden

- No direct document manipulation - work with copies
- No synchronous file operations
- No hardcoded schema paths
- No global state
