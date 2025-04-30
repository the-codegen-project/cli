[**@the-codegen-project/cli**](../API.md) • **Docs**

***

[Home](../API.md) / RunGeneratorContext

# Interface: RunGeneratorContext

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| `asyncapiDocument?` | [`AsyncAPIDocumentInterface`](AsyncAPIDocumentInterface.md) | [src/codegen/types.ts:103](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L103) |
| `configFilePath` | `string` | [src/codegen/types.ts:101](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L101) |
| `configuration` | \{ `$schema`: `string`; `generators`: ( \| \{ `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `preset`: `"parameters"`; `serializationType`: `"json"`; \} \| \{ `dependencies`: `string`[]; `enum`: `"enum"` \| `"union"`; `id`: `string`; `language`: `"typescript"`; `map`: `"map"` \| `"indexedObject"` \| `"record"`; `outputPath`: `string`; `preset`: `"payloads"`; `rawPropertyNames`: `boolean`; `serializationType`: `"json"`; `useForJavaScript`: `boolean`; \} \| \{ `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `parameterGeneratorId`: `string`; `payloadGeneratorId`: `string`; `preset`: `"channels"`; `protocols`: `"nats"`[]; \} \| \{ `channelsGeneratorId`: `string`; `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `preset`: `"client"`; `protocols`: `"nats"`[]; \} \| \{ `dependencies`: `string`[]; `id`: `string`; `options`: `any`; `preset`: `"custom"`; `renderFunction`: (...`args`) => `any`; \})[]; `inputPath`: `string`; `inputType`: `"asyncapi"`; `language`: `"typescript"`; \} | [src/codegen/types.ts:100](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L100) |
| `configuration.$schema?` | `string` | [src/codegen/types.ts:80](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L80) |
| `configuration.generators` | ( \| \{ `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `preset`: `"parameters"`; `serializationType`: `"json"`; \} \| \{ `dependencies`: `string`[]; `enum`: `"enum"` \| `"union"`; `id`: `string`; `language`: `"typescript"`; `map`: `"map"` \| `"indexedObject"` \| `"record"`; `outputPath`: `string`; `preset`: `"payloads"`; `rawPropertyNames`: `boolean`; `serializationType`: `"json"`; `useForJavaScript`: `boolean`; \} \| \{ `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `parameterGeneratorId`: `string`; `payloadGeneratorId`: `string`; `preset`: `"channels"`; `protocols`: `"nats"`[]; \} \| \{ `channelsGeneratorId`: `string`; `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `preset`: `"client"`; `protocols`: `"nats"`[]; \} \| \{ `dependencies`: `string`[]; `id`: `string`; `options`: `any`; `preset`: `"custom"`; `renderFunction`: (...`args`) => `any`; \})[] | [src/codegen/types.ts:84](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L84) |
| `configuration.inputPath` | `string` | [src/codegen/types.ts:82](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L82) |
| `configuration.inputType` | `"asyncapi"` | [src/codegen/types.ts:81](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L81) |
| `configuration.language?` | `"typescript"` | [src/codegen/types.ts:83](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L83) |
| `documentPath` | `string` | [src/codegen/types.ts:102](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L102) |
