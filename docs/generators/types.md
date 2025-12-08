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
- A constant record mapping channel IDs to channel addresses (exported through `TopicsMap`)

**Example usage:**
```typescript
import { Topics, TopicIds, ToTopics, ToTopicIds, TopicsMap } from './src/types/Types';

// Use the Topics type for type safety
const myTopic: Topics = 'user/signedup/{userId}';

// Convert channel ID to address
const address = ToTopics('userSignedup'); // Returns 'user/signedup/{userId}'

// Convert address to channel ID
const channelId = ToTopicIds('user/signedup/{userId}'); // Returns 'userSignedup'

// Use the map for direct lookup
const addressFromMap = TopicsMap['userSignedup']; // Returns 'user/signedup/{userId}'
```

### OpenAPI

- A type that represents all the operation paths in the document (exported through `Paths`)
- A type that represents all the operation IDs in the document (exported through `OperationIds`)
- A function that converts operation IDs to paths (exported through `ToPath`)
- A function that converts paths to operation IDs (exported through `ToOperationIds`)
- A constant record mapping operation IDs to paths (exported through `PathsMap`)

**Example usage:**
```typescript
import { Paths, OperationIds, ToPath, ToOperationIds, PathsMap } from './src/types/Types';

// Use the Paths type for type safety
const myPath: Paths = '/users/{userId}';

// Convert operation ID to path
const path = ToPath('getUserById'); // Returns '/users/{userId}'

// Convert path to operation IDs
const operationIds = ToOperationIds('/users/{userId}'); // Returns ['getUserById', 'updateUser', ...]

// Use the map for direct lookup
const pathFromMap = PathsMap['getUserById']; // Returns '/users/{userId}'
```