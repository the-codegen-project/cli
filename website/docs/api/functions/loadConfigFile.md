[**@the-codegen-project/cli**](../API.md) • **Docs**

***

[Home](../API.md) / loadConfigFile

# Function: loadConfigFile()

```ts
function loadConfigFile(filePath?): Promise<{
  config: TheCodegenConfiguration;
  filePath: string;
}>
```

Load the configuration from file.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `filePath`? | `string` |

## Returns

`Promise`\<\{
  `config`: [`TheCodegenConfiguration`](../type-aliases/TheCodegenConfiguration.md);
  `filePath`: `string`;
 \}\>

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `config` | [`TheCodegenConfiguration`](../type-aliases/TheCodegenConfiguration.md) | [src/codegen/configuration-manager.ts:32](https://github.com/the-codegen-project/cli/blob/main/src/codegen/configuration-manager.ts#L32) |
| `filePath` | `string` | [src/codegen/configuration-manager.ts:33](https://github.com/the-codegen-project/cli/blob/main/src/codegen/configuration-manager.ts#L33) |

## Defined in

[src/codegen/configuration-manager.ts:31](https://github.com/the-codegen-project/cli/blob/main/src/codegen/configuration-manager.ts#L31)
