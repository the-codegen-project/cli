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

This is supported through the following inputs: [`asyncapi`](#inputs)

It supports the following languages; [`typescript`](#typescript)

## Inputs

### `asyncapi`
The `payloads` preset with `asyncapi` input generates all the message payloads for each channel in the AsyncAPI document.

The return type is a map of channels and the model that represent the payload. 
 
## Languages
Each language has a set of constraints which means that some typed model types are either supported or not, or it might just be the code generation library that does not yet support it.

|  | Circular models | Enums | Tuples | Arrays | Nested Arrays | Dictionaries | Json Serialization | Validation |
|---|---|---|---|---|---|---|---|
| **TypeScript** | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

### TypeScript

Dependencies: 
- `ajv`: https://ajv.js.org/guide/getting-started.html ^8.17.1
