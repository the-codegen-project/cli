[**@the-codegen-project/cli**](../API.md) • **Docs**

***

[Home](../API.md) / realizeConfiguration

# Function: realizeConfiguration()

```ts
function realizeConfiguration(config): TheCodegenConfigurationInternal
```

Ensure that each generator has the default options along side custom properties

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | `object` |
| `config.$schema`? | `string` |
| `config.generators` | ( \| \{ `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `preset`: `"parameters"`; `serializationType`: `"json"`; \} \| \{ `dependencies`: `string`[]; `enum`: `"enum"` \| `"union"`; `id`: `string`; `language`: `"typescript"`; `map`: `"map"` \| `"indexedObject"` \| `"record"`; `outputPath`: `string`; `preset`: `"payloads"`; `rawPropertyNames`: `boolean`; `serializationType`: `"json"`; `useForJavaScript`: `boolean`; \} \| \{ `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `parameterGeneratorId`: `string`; `payloadGeneratorId`: `string`; `preset`: `"channels"`; `protocols`: `"nats"`[]; \} \| \{ `channelsGeneratorId`: `string`; `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `preset`: `"client"`; `protocols`: `"nats"`[]; \} \| \{ `dependencies`: `string`[]; `id`: `string`; `options`: `any`; `preset`: `"custom"`; `renderFunction`: (...`args`) => `any`; \})[] |
| `config.inputPath` | `string` |
| `config.inputType` | `"asyncapi"` |
| `config.language`? | `"typescript"` |

## Returns

[`TheCodegenConfigurationInternal`](../type-aliases/TheCodegenConfigurationInternal.md)

## Defined in

[src/codegen/configuration-manager.ts:76](https://github.com/the-codegen-project/cli/blob/main/src/codegen/configuration-manager.ts#L76)
