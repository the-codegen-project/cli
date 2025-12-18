---
sidebar_position: 3
---

# Understanding Generators

Generators (also called "presets") are the core of **The Codegen Project**. They determine what code gets generated from your inputs. Think of generators as specialized code factories - each one produces a specific type of code that helps you build your application faster.

## What Generators do you have?

Each generator focuses on a specific aspect of your application:

### Model Generators
These generators create data models and type definitions:

- [`payloads` preset](../generators/payloads.md) - Type-safe message/payload classes with serialization and validation support
- [`parameters` preset](../generators/parameters.md) - Type-safe parameter classes for API endpoints that make it easier to work with topics/paths/channels
- [`headers` preset](../generators/headers.md) - Type-safe header classes for message protocols, with serialization and validation support
- [`types` preset](../generators/types.md) - Shared type definitions and interfaces, which simplify your code in various ways
- [`models` preset](../generators/models.md) - General-purpose models from JSON Schema

### Communication Generators
These generators create code for interacting with APIs and message brokers:

- [`channels` preset](../generators/channels.md) - Communication functions for message brokers, ensure the right message, headers, and topics/paths/channels are used
- [`client` preset](../generators/client.md) - Wraps channels into a reusable wrappers, cant get more code then this.

### Custom Generators
- [`custom` preset](../generators/custom.md) - Your own custom code generation logic

## How Generators Work

### 1. Input Processing
Generators take your specifications (AsyncAPI, OpenAPI, or JSON Schema) and extract the relevant information:

```js
export default {
  inputType: 'asyncapi',
  inputPath: './my-api.yaml'
};
```

### 2. Code Generation
Based on the generator configuration, The Codegen Project:
- Parses your API specification
- Extracts schemas, operations, channels, and other relevant data
- Use whatever generators you added and outputs files to your specified directory

```js
export default {
  inputType: 'asyncapi',
  inputPath: './my-api.yaml',
  generators: [
    {
      preset: 'payloads',
      outputPath: './src/payloads',
      language: 'typescript'
    }
  ]
};
```

### 3. Generated Output
Each generator produces different code, so have a look at each generator to get a full picture, but here is a few examples:

**Payload Generator** produces:
```typescript
export class UserSignup {
  constructor(data: UserSignupData) { /* ... */ }
  marshal(): string { /* ... */ }
  static unmarshal(json: string): UserSignup { /* ... */ }
}
```

**Channels Generator** produces:
```typescript
export const Protocols = {
  nats: {
    publishToUserSignup: ...,
    subscribeToUserSignup: ...,
    jetStreamPublishToUserSignup: ...
  },
  kafka: {
    publishToUserSignup: ...,
    subscribeToUserSignup: ...
  },
  // ... other protocols
};
```

## Input Type Support

Different generators work with different input types:

| Generator | AsyncAPI | OpenAPI | JSON Schema |
|-----------|----------|---------|-------------|
| `payloads` | ✅ | ✅ | ❌ |
| `parameters` | ✅ | ✅ | ❌ |
| `headers` | ✅ | ✅ | ❌ |
| `types` | ✅ | ✅ | ❌ |
| `channels` | ✅ | ❌ | ❌ |
| `client` | ✅ | ❌ | ❌ |
| `models` | ✅ | ✅ | ✅ |
| `custom` | ✅ | ✅ | ✅ |

## Language Support

Currently, The Codegen Project supports:

- **TypeScript** - Full support for all generators

Each language has specific capabilities and constraints. Check the [generator documentation](../generators/README.md) for details.

## Generator Dependencies

Some generators automatically include dependencies on others:

- **`channels`** generator automatically uses `payloads`, `headers`, and `parameters` generators if they're not already configured
- This ensures you have all the necessary models and types for your channel functions

## Configuration Options

Each generator has its own set of configuration options, for example here is payloads:

```js
export default {
  inputType: 'asyncapi',
  inputPath: './my-api.yaml',
  generators: [
    {
      preset: 'payloads',
      outputPath: './src/payloads',
      language: 'typescript',
      includeValidation: true,
      serializationType: 'json'
    }
  ]
};
```

## Next Steps

- **[Explore Generator Documentation](../generators/README.md)** - Detailed docs for each generator
- **[Learn about Protocol Support](./protocols.md)** - How generators work with messaging protocols
- **[Check Out Examples](../../examples/)** - See generators in action

