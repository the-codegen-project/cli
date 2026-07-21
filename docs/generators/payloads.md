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
      language: 'typescript'
    }
  ]
};
```

`payloads` preset is for generating models that represent typed models that can be serialized into message payloads for communication use-cases.

This is supported through the following inputs: `asyncapi`, `openapi`

It supports the following languages; [`typescript`](#typescript)

## Companion Interface

Every generated **object** payload file exports **two** symbols: the payload
class (`<Name>`) and a plain-data companion interface (`<Name>Interface`)
declared above it. The class constructor takes the interface
(`constructor(input: <Name>Interface)`), so the two always stay in sync.

```typescript
export { UserSignedUp, UserSignedUpInterface };
```

This lets you pass a **plain object** wherever a channel expects a payload —
you do not have to construct the class yourself:

```typescript
// Both of these are accepted by every generated publish/request helper:
await publishToUserSignedup({ message: { displayName: 'Jane', email: 'jane@example.com' }, nc });
await publishToUserSignedup({ message: new UserSignedUp({ displayName: 'Jane', email: 'jane@example.com' }), nc });
```

Channel consumers type their message argument as the union
`<Name>Interface | <Name>` and normalize it to a class instance internally (via
an `instanceof` guard) before calling `.marshal()`. The plain-object form is
purely an ergonomic convenience; the generated code always marshals a class
instance.

This applies to **object** payloads only. Non-object payloads
(unions, primitives, arrays, and enums) keep their `type`/`enum` shape and
free-function marshalling — they have no companion interface and are exported as
a single symbol. See the [protocols documentation](../protocols) for how each
channel accepts payloads.

## Languages
Each language has a set of constraints which means that some typed model types are either supported or not, or it might just be the code generation library that does not yet support it.

|  | Circular models | Enums | Tuples | Arrays | Nested Arrays | Dictionaries | Json Serialization | Validation |
|---|---|---|---|---|---|---|---|---|
| **TypeScript** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

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
