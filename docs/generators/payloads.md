---
sidebar_position: 99
---

# 🐔 Payloads

```js
export default {
  ...,
  generators: [
    {
      preset: 'payloads',
      outputPath: './src/payloads',
      serializationType: 'json', 
  	  language: 'typescript',
    }
  ]
};
```

`payloads` preset is for generating models that represent typed models that can be serialized into message payloads for communication use-cases.

This is supported through the following inputs: `asyncapi`, `openapi`

It supports the following languages; [`typescript`](#typescript)

## Languages
Each language has a set of constraints which means that some typed model types are either supported or not, or it might just be the code generation library that does not yet support it.

|  | Circular models | Enums | Tuples | Arrays | Nested Arrays | Dictionaries | Json Serialization | Validation |
|---|---|---|---|---|---|---|---|---|
| **TypeScript** | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

### TypeScript

Dependencies: 
- If validation enabled, [ajv](https://ajv.js.org/guide/getting-started.html): ^8.17.1

#### Validation
Each generated class includes built-in JSON Schema validation capabilities through two static methods:

- `validate`: Validates data against the schema. Use this method when you want to validate data.

```typescript
// Example
const result = UserSignedUp.validate({ data: userData });
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

- `createValidator`: Creates a reusable validator function. Use this when you need to validate multiple instances of the same type and want to avoid recreating the validator each time.

```typescript
// Example
const validator = UserSignedUp.createValidator();
const result = UserSignedUp.validate({ data: userData, ajvValidatorFunction: validator });
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

Both methods support custom Ajv instances and options for advanced validation scenarios.
