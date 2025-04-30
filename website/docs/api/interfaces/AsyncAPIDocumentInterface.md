[**@the-codegen-project/cli**](../API.md) • **Docs**

***

[Home](../API.md) / AsyncAPIDocumentInterface

# Interface: AsyncAPIDocumentInterface

## Extends

- `BaseModel`\<`v2.AsyncAPIObject` \| `v3.AsyncAPIObject`\>.`ExtensionsMixinInterface`

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `_json` | `readonly` | `AsyncAPIObject` \| `AsyncAPIObject` | `BaseModel._json` | node\_modules/@asyncapi/parser/esm/models/base.d.ts:8 |
| `_meta` | `readonly` | `ModelMetadata` | `BaseModel._meta` | node\_modules/@asyncapi/parser/esm/models/base.d.ts:9 |

## Methods

### allChannels()

```ts
allChannels(): ChannelsInterface
```

#### Returns

`ChannelsInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:26

***

### allMessages()

```ts
allMessages(): MessagesInterface
```

#### Returns

`MessagesInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:28

***

### allOperations()

```ts
allOperations(): OperationsInterface
```

#### Returns

`OperationsInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:27

***

### allSchemas()

```ts
allSchemas(): SchemasInterface
```

#### Returns

`SchemasInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:29

***

### allServers()

```ts
allServers(): ServersInterface
```

#### Returns

`ServersInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:25

***

### channels()

```ts
channels(): ChannelsInterface
```

#### Returns

`ChannelsInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:19

***

### components()

```ts
components(): ComponentsInterface
```

#### Returns

`ComponentsInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:24

***

### createModel()

```ts
protected createModel<T>(
   Model, 
   value, 
   meta): T
```

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `BaseModel`\<`any`, \{\}\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `Model` | `Constructor`\<`T`\> |
| `value` | `InferModelData`\<`T`\> |
| `meta` | `Omit`\<`ModelMetadata`, `"asyncapi"`\> & `InferModelMetadata`\<`T`\> |

#### Returns

`T`

#### Inherited from

`BaseModel.createModel`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/base.d.ts:16

***

### defaultContentType()

```ts
defaultContentType(): undefined | string
```

#### Returns

`undefined` \| `string`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:15

***

### extensions()

```ts
extensions(): ExtensionsInterface
```

#### Returns

`ExtensionsInterface`

#### Inherited from

`ExtensionsMixinInterface.extensions`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/mixins.d.ts:15

***

### hasDefaultContentType()

```ts
hasDefaultContentType(): boolean
```

#### Returns

`boolean`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:16

***

### info()

```ts
info(): InfoInterface
```

#### Returns

`InfoInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:17

***

### json()

#### json()

```ts
json<T>(): T
```

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `AsyncAPIObject` \| `AsyncAPIObject` |

##### Returns

`T`

##### Inherited from

`BaseModel.json`

##### Defined in

node\_modules/@asyncapi/parser/esm/models/base.d.ts:11

#### json(key)

```ts
json<K>(key): AsyncAPIObject | AsyncAPIObject[K]
```

##### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* \| `"id"` \| `"asyncapi"` \| `"info"` \| `"channels"` \| \`x-$\{string\}\` \| `"defaultContentType"` \| `"servers"` \| `"components"` |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `K` |

##### Returns

`AsyncAPIObject` \| `AsyncAPIObject`\[`K`\]

##### Inherited from

`BaseModel.json`

##### Defined in

node\_modules/@asyncapi/parser/esm/models/base.d.ts:12

***

### jsonPath()

```ts
jsonPath(field?): string
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `field`? | `string` |

#### Returns

`string`

#### Inherited from

`BaseModel.jsonPath`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/base.d.ts:15

***

### messages()

```ts
messages(): MessagesInterface
```

#### Returns

`MessagesInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:21

***

### meta()

#### meta()

```ts
meta(): ModelMetadata
```

##### Returns

`ModelMetadata`

##### Inherited from

`BaseModel.meta`

##### Defined in

node\_modules/@asyncapi/parser/esm/models/base.d.ts:13

#### meta(key)

```ts
meta<K>(key): ModelMetadata[K]
```

##### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* keyof `ModelMetadata` |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `K` |

##### Returns

`ModelMetadata`\[`K`\]

##### Inherited from

`BaseModel.meta`

##### Defined in

node\_modules/@asyncapi/parser/esm/models/base.d.ts:14

***

### operations()

```ts
operations(): OperationsInterface
```

#### Returns

`OperationsInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:20

***

### schemas()

```ts
schemas(): SchemasInterface
```

#### Returns

`SchemasInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:22

***

### securitySchemes()

```ts
securitySchemes(): SecuritySchemesInterface
```

#### Returns

`SecuritySchemesInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:23

***

### servers()

```ts
servers(): ServersInterface
```

#### Returns

`ServersInterface`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:18

***

### version()

```ts
version(): string
```

#### Returns

`string`

#### Defined in

node\_modules/@asyncapi/parser/esm/models/asyncapi.d.ts:14
