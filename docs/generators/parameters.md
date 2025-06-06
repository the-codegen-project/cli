---
sidebar_position: 99
---

# Parameters

```js
export default {
  ...,
  generators: [
    {
      preset: 'parameters',
      outputPath: './src/parameters',
      serializationType: 'json',
      language: 'typescript',
    }
  ]
};
```

`parameters` preset is for generating models that represent typed models for parameters used in API operations.

This is supported through the following inputs: [`asyncapi`](#inputs), [`openapi`](#inputs)

It supports the following languages; `typescript`

## Inputs

### `asyncapi`
The `parameters` preset with `asyncapi` input generates all the parameters for each channel in the AsyncAPI document.

The return type is a map of channels and the model that represent the parameters.

### `openapi`
The `parameters` preset with `openapi` input generates all the parameters for each operation in the OpenAPI document, including both path and query parameters.

The return type is a map of operations and the model that represent the parameters.

## Typescript

### AsyncAPI Functions

Each generated AsyncAPI parameter class includes the following methods:

#### Channel Parameter Substitution
- `getChannelWithParameters(channel: string): string`: Replaces parameter placeholders in the channel/topic string with actual parameter values.

```typescript
// Example
const params = new UserSignedupParameters({
  myParameter: 'test',
  enumParameter: 'openapi'
});
const channel = params.getChannelWithParameters('user/{my_parameter}/signup/{enum_parameter}');
// Result: 'user/test/signup/openapi'
```

#### Static Factory Method
- `static createFromChannel(msgSubject: string, channel: string, regex: RegExp): ParameterClass`: Creates a parameter instance by extracting values from a message subject using the provided channel template and regex.

```typescript
// Example
const params = UserSignedupParameters.createFromChannel(
  'user.test.signup.openapi',
  'user/{my_parameter}/signup/{enum_parameter}',
  /user\.(.+)\.signup\.(.+)/
);
```

### OpenAPI Functions

Each generated OpenAPI parameter class includes comprehensive serialization and deserialization capabilities:

#### Path Parameter Serialization
- `serializePathParameters(): Record<string, string>`: Serializes path parameters according to OpenAPI 2.0/3.x specification for URL path substitution.

```typescript
// Example
const params = new FindPetsByStatusParameters({
  status: 'available',
  categoryId: 123
});
const pathParams = params.serializePathParameters();
// Result: { status: 'available', categoryId: '123' }
```

#### Query Parameter Serialization
- `serializeQueryParameters(): URLSearchParams`: Serializes query parameters according to OpenAPI specification with proper encoding and style handling.

```typescript
// Example
const queryParams = params.serializeQueryParameters();
const queryString = queryParams.toString();
// Result: 'limit=10&offset=0&tags=dog,cat'
```

#### Complete URL Serialization
- `serializeUrl(basePath: string): string`: Generates the complete URL with both path and query parameters properly serialized.

```typescript
// Example
const url = params.serializeUrl('/pet/findByStatus/{status}/{categoryId}');
// Result: '/pet/findByStatus/available/123?limit=10&offset=0&tags=dog,cat'
```

#### URL Deserialization
- `deserializeUrl(url: string): void`: Parses a URL and populates the instance properties from query parameters.

```typescript
// Example
const params = new FindPetsByStatusParameters({ status: 'available', categoryId: 123 });
params.deserializeUrl('/pet/findByStatus/available/123?limit=5&tags=dog,cat');
// params.limit is now 5, params.tags is now ['dog', 'cat']
```

#### Static Factory Methods
- `static fromUrl(url: string, basePath: string, ...requiredDefaults): ParameterClass`: Creates a new parameter instance from a complete URL by extracting both path and query parameters.

```typescript
// Example
const params = FindPetsByStatusParameters.fromUrl(
  '/pet/findByStatus/available/123?limit=5&tags=dog',
  '/pet/findByStatus/{status}/{categoryId}'
);
// params.status is 'available', params.categoryId is 123, params.limit is 5
```

### Parameter Style Support

The OpenAPI generator supports all OpenAPI parameter styles and serialization formats:

#### Path Parameters
- **simple** (default): `value1,value2` or `key1,value1,key2,value2`
- **label**: `.value1.value2` or `.key1.value1.key2.value2`
- **matrix**: `;param=value1,value2` or `;key1=value1;key2=value2`

#### Query Parameters
- **form** (default): `param=value1&param=value2` (exploded) or `param=value1,value2`
- **spaceDelimited**: `param=value1 value2`
- **pipeDelimited**: `param=value1|value2`
- **deepObject**: `param[key1]=value1&param[key2]=value2`

### Type Safety

All parameter classes are fully typed with:
- Enum parameter types for restricted values
- Required vs optional parameter distinction
- Proper TypeScript casting for different parameter types (string, number, boolean, arrays)
- Support for complex parameter schemas including nested objects and arrays

### OpenAPI 2.0 Compatibility

The generator supports OpenAPI 2.0 `collectionFormat` parameter serialization:
- `csv`: Comma-separated values
- `ssv`: Space-separated values  
- `tsv`: Tab-separated values (treated as CSV)
- `pipes`: Pipe-separated values
- `multi`: Multiple parameter instances

These are automatically converted to equivalent OpenAPI 3.0 style/explode combinations for consistent handling.
