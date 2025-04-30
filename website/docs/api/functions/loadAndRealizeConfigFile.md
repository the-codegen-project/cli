[**@the-codegen-project/cli**](../API.md) • **Docs**

***

[Home](../API.md) / loadAndRealizeConfigFile

# Function: loadAndRealizeConfigFile()

```ts
function loadAndRealizeConfigFile(filePath?): Promise<{
  config: TheCodegenConfigurationInternal;
  filePath: string;
}>
```

Load the configuration file and realize it with default options if necessary.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath`? | `string` |

## Returns

`Promise`\<\{
  `config`: [`TheCodegenConfigurationInternal`](../type-aliases/TheCodegenConfigurationInternal.md);
  `filePath`: `string`;
 \}\>

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `config` | [`TheCodegenConfigurationInternal`](../type-aliases/TheCodegenConfigurationInternal.md) | [src/codegen/configuration-manager.ts:62](https://github.com/the-codegen-project/cli/blob/main/src/codegen/configuration-manager.ts#L62) |
| `filePath` | `string` | [src/codegen/configuration-manager.ts:63](https://github.com/the-codegen-project/cli/blob/main/src/codegen/configuration-manager.ts#L63) |

## Defined in

[src/codegen/configuration-manager.ts:61](https://github.com/the-codegen-project/cli/blob/main/src/codegen/configuration-manager.ts#L61)
