[**@the-codegen-project/cli**](../API.md) • **Docs**

***

[Home](../API.md) / zodAsyncAPICodegenConfiguration

# Variable: zodAsyncAPICodegenConfiguration

```ts
const zodAsyncAPICodegenConfiguration: ZodObject<{
  $schema: ZodOptional<ZodString>;
  generators: ZodArray<ZodUnion<[ZodObject<{
     dependencies: ZodDefault<ZodOptional<ZodArray<ZodString, "many">>>;
     enum: ZodDefault<ZodOptional<ZodEnum<[..., ...]>>>;
     id: ZodDefault<ZodOptional<ZodString>>;
     language: ZodDefault<ZodOptional<ZodLiteral<"typescript">>>;
     map: ZodDefault<ZodOptional<ZodEnum<[..., ..., ...]>>>;
     outputPath: ZodDefault<ZodOptional<ZodString>>;
     preset: ZodDefault<ZodLiteral<"payloads">>;
     rawPropertyNames: ZodDefault<ZodOptional<ZodBoolean>>;
     serializationType: ZodDefault<ZodOptional<ZodLiteral<"json">>>;
     useForJavaScript: ZodDefault<ZodOptional<ZodBoolean>>;
    }, "strip", ZodTypeAny, {
     dependencies: string[];
     enum: "enum" | "union";
     id: string;
     language: "typescript";
     map: "map" | "indexedObject" | "record";
     outputPath: string;
     preset: "payloads";
     rawPropertyNames: boolean;
     serializationType: "json";
     useForJavaScript: boolean;
    }, {
     dependencies: string[];
     enum: "enum" | "union";
     id: string;
     language: "typescript";
     map: "map" | "indexedObject" | "record";
     outputPath: string;
     preset: "payloads";
     rawPropertyNames: boolean;
     serializationType: "json";
     useForJavaScript: boolean;
    }>, ZodObject<{
     dependencies: ZodDefault<ZodOptional<ZodArray<ZodString, "many">>>;
     id: ZodDefault<ZodOptional<ZodString>>;
     language: ZodDefault<ZodOptional<ZodLiteral<"typescript">>>;
     outputPath: ZodDefault<ZodString>;
     preset: ZodDefault<ZodLiteral<"parameters">>;
     serializationType: ZodDefault<ZodOptional<ZodLiteral<"json">>>;
    }, "strip", ZodTypeAny, {
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "parameters";
     serializationType: "json";
    }, {
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "parameters";
     serializationType: "json";
    }>, ZodObject<{
     dependencies: ZodDefault<ZodOptional<ZodArray<ZodString, "many">>>;
     id: ZodDefault<ZodOptional<ZodString>>;
     language: ZodDefault<ZodOptional<ZodLiteral<"typescript">>>;
     outputPath: ZodDefault<ZodString>;
     parameterGeneratorId: ZodDefault<ZodOptional<ZodString>>;
     payloadGeneratorId: ZodDefault<ZodOptional<ZodString>>;
     preset: ZodDefault<ZodLiteral<"channels">>;
     protocols: ZodDefault<ZodArray<ZodEnum<[...]>, "many">>;
    }, "strip", ZodTypeAny, {
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     parameterGeneratorId: string;
     payloadGeneratorId: string;
     preset: "channels";
     protocols: "nats"[];
    }, {
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     parameterGeneratorId: string;
     payloadGeneratorId: string;
     preset: "channels";
     protocols: "nats"[];
    }>, ZodObject<{
     channelsGeneratorId: ZodDefault<ZodOptional<ZodString>>;
     dependencies: ZodDefault<ZodOptional<ZodArray<ZodString, "many">>>;
     id: ZodDefault<ZodOptional<ZodString>>;
     language: ZodDefault<ZodOptional<ZodLiteral<"typescript">>>;
     outputPath: ZodDefault<ZodString>;
     preset: ZodDefault<ZodLiteral<"client">>;
     protocols: ZodDefault<ZodArray<ZodEnum<[...]>, "many">>;
    }, "strip", ZodTypeAny, {
     channelsGeneratorId: string;
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "client";
     protocols: "nats"[];
    }, {
     channelsGeneratorId: string;
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "client";
     protocols: "nats"[];
    }>, ZodObject<{
     dependencies: ZodOptional<ZodArray<ZodString, "many">>;
     id: ZodOptional<ZodString>;
     options: ZodOptional<ZodAny>;
     preset: ZodLiteral<"custom">;
     renderFunction: ZodFunction<ZodTuple<[ZodOptional<...>, ZodOptional<...>], ZodUnknown>, ZodAny>;
    }, "strip", ZodTypeAny, {
     dependencies: string[];
     id: string;
     options: any;
     preset: "custom";
     renderFunction: (...args) => any;
    }, {
     dependencies: string[];
     id: string;
     options: any;
     preset: "custom";
     renderFunction: (...args) => any;
    }>]>, "many">;
  inputPath: ZodString;
  inputType: ZodLiteral<"asyncapi">;
  language: ZodOptional<ZodEnum<["typescript"]>>;
 }, "strip", ZodTypeAny, {
  $schema: string;
  generators: (
     | {
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "parameters";
     serializationType: "json";
    }
     | {
     dependencies: string[];
     enum: "enum" | "union";
     id: string;
     language: "typescript";
     map: "map" | "indexedObject" | "record";
     outputPath: string;
     preset: "payloads";
     rawPropertyNames: boolean;
     serializationType: "json";
     useForJavaScript: boolean;
    }
     | {
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     parameterGeneratorId: string;
     payloadGeneratorId: string;
     preset: "channels";
     protocols: "nats"[];
    }
     | {
     channelsGeneratorId: string;
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "client";
     protocols: "nats"[];
    }
     | {
     dependencies: string[];
     id: string;
     options: any;
     preset: "custom";
     renderFunction: (...args) => any;
    })[];
  inputPath: string;
  inputType: "asyncapi";
  language: "typescript";
 }, {
  $schema: string;
  generators: (
     | {
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "parameters";
     serializationType: "json";
    }
     | {
     dependencies: string[];
     enum: "enum" | "union";
     id: string;
     language: "typescript";
     map: "map" | "indexedObject" | "record";
     outputPath: string;
     preset: "payloads";
     rawPropertyNames: boolean;
     serializationType: "json";
     useForJavaScript: boolean;
    }
     | {
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     parameterGeneratorId: string;
     payloadGeneratorId: string;
     preset: "channels";
     protocols: "nats"[];
    }
     | {
     channelsGeneratorId: string;
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "client";
     protocols: "nats"[];
    }
     | {
     dependencies: string[];
     id: string;
     options: any;
     preset: "custom";
     renderFunction: (...args) => any;
    })[];
  inputPath: string;
  inputType: "asyncapi";
  language: "typescript";
}>;
```

## Type declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `$schema` | `ZodOptional`\<`ZodString`\> | [src/codegen/types.ts:80](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L80) |
| `generators` | `ZodArray`\<`ZodUnion`\<[`ZodObject`\<\{ `dependencies`: `ZodDefault`\<`ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>\>; `enum`: `ZodDefault`\<`ZodOptional`\<`ZodEnum`\<[..., ...]\>\>\>; `id`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `language`: `ZodDefault`\<`ZodOptional`\<`ZodLiteral`\<`"typescript"`\>\>\>; `map`: `ZodDefault`\<`ZodOptional`\<`ZodEnum`\<[..., ..., ...]\>\>\>; `outputPath`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `preset`: `ZodDefault`\<`ZodLiteral`\<`"payloads"`\>\>; `rawPropertyNames`: `ZodDefault`\<`ZodOptional`\<`ZodBoolean`\>\>; `serializationType`: `ZodDefault`\<`ZodOptional`\<`ZodLiteral`\<`"json"`\>\>\>; `useForJavaScript`: `ZodDefault`\<`ZodOptional`\<`ZodBoolean`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `dependencies`: `string`[]; `enum`: `"enum"` \| `"union"`; `id`: `string`; `language`: `"typescript"`; `map`: `"map"` \| `"indexedObject"` \| `"record"`; `outputPath`: `string`; `preset`: `"payloads"`; `rawPropertyNames`: `boolean`; `serializationType`: `"json"`; `useForJavaScript`: `boolean`; \}, \{ `dependencies`: `string`[]; `enum`: `"enum"` \| `"union"`; `id`: `string`; `language`: `"typescript"`; `map`: `"map"` \| `"indexedObject"` \| `"record"`; `outputPath`: `string`; `preset`: `"payloads"`; `rawPropertyNames`: `boolean`; `serializationType`: `"json"`; `useForJavaScript`: `boolean`; \}\>, `ZodObject`\<\{ `dependencies`: `ZodDefault`\<`ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>\>; `id`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `language`: `ZodDefault`\<`ZodOptional`\<`ZodLiteral`\<`"typescript"`\>\>\>; `outputPath`: `ZodDefault`\<`ZodString`\>; `preset`: `ZodDefault`\<`ZodLiteral`\<`"parameters"`\>\>; `serializationType`: `ZodDefault`\<`ZodOptional`\<`ZodLiteral`\<`"json"`\>\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `preset`: `"parameters"`; `serializationType`: `"json"`; \}, \{ `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `preset`: `"parameters"`; `serializationType`: `"json"`; \}\>, `ZodObject`\<\{ `dependencies`: `ZodDefault`\<`ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>\>; `id`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `language`: `ZodDefault`\<`ZodOptional`\<`ZodLiteral`\<`"typescript"`\>\>\>; `outputPath`: `ZodDefault`\<`ZodString`\>; `parameterGeneratorId`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `payloadGeneratorId`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `preset`: `ZodDefault`\<`ZodLiteral`\<`"channels"`\>\>; `protocols`: `ZodDefault`\<`ZodArray`\<`ZodEnum`\<[...]\>, `"many"`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `parameterGeneratorId`: `string`; `payloadGeneratorId`: `string`; `preset`: `"channels"`; `protocols`: `"nats"`[]; \}, \{ `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `parameterGeneratorId`: `string`; `payloadGeneratorId`: `string`; `preset`: `"channels"`; `protocols`: `"nats"`[]; \}\>, `ZodObject`\<\{ `channelsGeneratorId`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `dependencies`: `ZodDefault`\<`ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>\>; `id`: `ZodDefault`\<`ZodOptional`\<`ZodString`\>\>; `language`: `ZodDefault`\<`ZodOptional`\<`ZodLiteral`\<`"typescript"`\>\>\>; `outputPath`: `ZodDefault`\<`ZodString`\>; `preset`: `ZodDefault`\<`ZodLiteral`\<`"client"`\>\>; `protocols`: `ZodDefault`\<`ZodArray`\<`ZodEnum`\<[...]\>, `"many"`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `channelsGeneratorId`: `string`; `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `preset`: `"client"`; `protocols`: `"nats"`[]; \}, \{ `channelsGeneratorId`: `string`; `dependencies`: `string`[]; `id`: `string`; `language`: `"typescript"`; `outputPath`: `string`; `preset`: `"client"`; `protocols`: `"nats"`[]; \}\>, `ZodObject`\<\{ `dependencies`: `ZodOptional`\<`ZodArray`\<`ZodString`, `"many"`\>\>; `id`: `ZodOptional`\<`ZodString`\>; `options`: `ZodOptional`\<`ZodAny`\>; `preset`: `ZodLiteral`\<`"custom"`\>; `renderFunction`: `ZodFunction`\<`ZodTuple`\<[`ZodOptional`\<...\>, `ZodOptional`\<...\>], `ZodUnknown`\>, `ZodAny`\>; \}, `"strip"`, `ZodTypeAny`, \{ `dependencies`: `string`[]; `id`: `string`; `options`: `any`; `preset`: `"custom"`; `renderFunction`: (...`args`) => `any`; \}, \{ `dependencies`: `string`[]; `id`: `string`; `options`: `any`; `preset`: `"custom"`; `renderFunction`: (...`args`) => `any`; \}\>]\>, `"many"`\> | [src/codegen/types.ts:84](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L84) |
| `inputPath` | `ZodString` | [src/codegen/types.ts:82](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L82) |
| `inputType` | `ZodLiteral`\<`"asyncapi"`\> | [src/codegen/types.ts:81](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L81) |
| `language` | `ZodOptional`\<`ZodEnum`\<[`"typescript"`]\>\> | [src/codegen/types.ts:83](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L83) |

## Defined in

[src/codegen/types.ts:79](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L79)
