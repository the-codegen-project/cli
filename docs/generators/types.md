---
sidebar_position: 99
---

# Types

```js
export default {
  ...,
  generators: [
    {
      preset: 'types',
      outputPath: './src/types',
      language: 'typescript',
    }
  ]
};
```

`types` preset is for generating simple types and utility functions that change based on the AsyncAPI document.

This is supported through the following inputs: `asyncapi`

It supports the following languages; `typescript`

## What it generates
Here is what each language generate with this generator.

### TypeScript

- A type that represents all the channel addresses in the document
- A type that represents all the channel IDs in the document
- A function that converts channel IDs to channel addresses
- A function that converts channel addresses to channel IDs