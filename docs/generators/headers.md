---
sidebar_position: 99
sidebar_custom_props:
  generatorPreset: headers
---

# Headers

```js
export default {
  ...,
  generators: [
    {
      preset: 'headers',
      outputPath: './src/headers',
      serializationType: 'json',
      includeValidation: true,
      language: 'typescript',
    }
  ]
};
```

`headers` preset is for generating models that represent typed models representing headers.

This is supported through the following inputs: [`asyncapi`](#inputs), [`openapi`](#inputs)

It supports the following languages; `typescript`

## Inputs

### `asyncapi`
The `headers` preset with `asyncapi` input generates all the message headers for each channel in the AsyncAPI document.

The return type is a map of channels and the model that represent the headers. 

### `openapi`
The `headers` preset with `openapi` input generates all the headers for each path in the OpenAPI document.

The return type is a map of paths and the model that represent the headers. 

## Options
These are the available options for the `headers` generator;

| **Option** | Default | Type | Description |
|---|---|---|---|
| id | `'headers-typescript'` | String | Unique identifier for this generator instance. The `channels`/`client` generators reference it as their `headerGeneratorId`. |
| dependencies | `[]` | String[] | IDs of other generators that must run before this one. |
| outputPath | `'src/__gen__/headers'` | String | Directory the generated header models are written to. |
| serializationType | `'json'` | `'json'` | Serialization format used by the generated models. Only `json` is supported. |
| includeValidation | `true` | Boolean | Include the built-in JSON Schema `validate`/`createValidator` methods. Requires `ajv` and `ajv-formats` (see [Dependencies](#typescript)). |

## Typescript
Dependencies: 
- If validation enabled, [ajv](https://ajv.js.org/guide/getting-started.html): ^8.17.1
- If validation enabled, [ajv-formats](https://github.com/ajv-validator/ajv-formats): ^3.0.1

### Validation
Each generated class includes built-in JSON Schema validation capabilities through two static methods:

- `validate`: Validates headers against the schema. Use this method when you want to validate data.

```typescript
// Example
const result = UserSignedUpHeaders.validate({ data: headers });
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

- `createValidator`: Creates a reusable validator function. Use this when you need to validate multiple instances of the same type and want to avoid recreating the validator each time.

```typescript
// Example
const validator = UserSignedUpHeaders.createValidator();
const result = UserSignedUpHeaders.validate({ data: headers, ajvValidatorFunction: validator });
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

Both methods support custom Ajv instances and options for advanced validation scenarios.
