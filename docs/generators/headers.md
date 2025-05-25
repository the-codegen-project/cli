---
sidebar_position: 99
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
