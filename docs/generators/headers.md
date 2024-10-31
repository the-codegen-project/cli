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

This is supported through the following inputs: [`asyncapi`](#inputs)

It supports the following languages; [`typescript`](#typescript)

## Inputs

### `asyncapi`
The `headers` preset with `asyncapi` input generates all the message headers for each channel in the AsyncAPI document.

The return type is a map of channels and the model that represent the headers. 
