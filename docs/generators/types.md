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

This is supported through the following inputs: `asyncapi` and `openapi`

It supports the following languages; `typescript`

## What it generates
Here is what each language generate with this generator.

### AsyncAPI

- A type that represents all the channel addresses in the document (exported through `Topics`)
- A type that represents all the channel IDs in the document (exported through `TopicIds`)
- A function that converts channel addresses to channel IDs (exported through `ToTopicIds`)
- A function that converts channel IDs to channel addresses (exported through `ToTopics`)

### OpenAPI

- A type that represents all the operation paths in the document (exported through `Paths`)
- A type that represents all the operation IDs in the document (exported through `OperationIds`)
- A function that converts operation IDs to paths (exported through `ToPath`)
- A function that converts paths to operation IDs (exported through `ToOperationIds`)