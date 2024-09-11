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

It supports the following languages; [`typescript`](#typescript), [`java`](#java), [`csharp`](#c)

## Inputs

### `asyncapi`
The `payloads` preset with `asyncapi` input generates all the message payloads for each channel in the AsyncAPI document.

The return type is a map of channels and the model that represent the payload. 
 
## Languages
Each language has a set of constraints which means that some typed model types are either supported or not, or it might just be the code generation library that does not yet support it.

|  | Circular models | Enums | Tuples | Arrays | Nested Arrays | Dictionaries | Json Serialization |
|---|---|---|---|---|---|---|---|
| **Java** | X | X | X | X | X | X | X |
| **TypeScript** | X | X | X | X | X | X | X |
| **C#** | X | X | X | X | X | X | X |

### Java
For Java, Jackson databind dependency needs to be added manually

```xml
<dependency>
  <groupId>com.fasterxml.jackson.core</groupId>
  <artifactId>jackson-databind</artifactId>
  <version>2.16.0</version>
</dependency>
```

### TypeScript

Dependencies: None

### C#
For C# it supports two different JSON Serialization libraries, `System.Text.Json` and `Newtonsoft.Json`.

#### System JSON
```js
export default {
  ...,
  generators: [
    {
      preset: 'payloads',
      outputPath: './src/payloads',
      serializationType: 'json', 
      serializationLibrary: 'json',
  	  language: 'csharp',
    }
  ]
};
```

Required dependencies that needs to be added manually:
```xml
<ItemGroup>
  <PackageReference Include="System.Text.Json" Version="8.0.4" />
</ItemGroup>
```

#### Newtonsoft
```js
export default {
  ...,
  generators: [
    {
      preset: 'payloads',
      outputPath: './src/payloads',
      serializationType: 'json', 
      serializationLibrary: 'newtonsoft',
  	  language: 'csharp',
    }
  ]
};
```

Required dependencies that needs to be added manually:
```xml
<ItemGroup>
  <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
</ItemGroup>
```