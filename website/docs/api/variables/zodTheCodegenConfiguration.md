[**@the-codegen-project/cli**](../API.md) • **Docs**

***

[Home](../API.md) / zodTheCodegenConfiguration

# Variable: zodTheCodegenConfiguration

```ts
const zodTheCodegenConfiguration: ZodDiscriminatedUnion<"inputType", [ZodObject<{
  $schema: ZodOptional<ZodString>;
  generators: ZodArray<ZodUnion<[ZodObject<{
     dependencies: ZodDefault<ZodOptional<...>>;
     enum: ZodDefault<ZodOptional<...>>;
     id: ZodDefault<ZodOptional<...>>;
     language: ZodDefault<ZodOptional<...>>;
     map: ZodDefault<ZodOptional<...>>;
     outputPath: ZodDefault<ZodOptional<...>>;
     preset: ZodDefault<ZodLiteral<...>>;
     rawPropertyNames: ZodDefault<ZodOptional<...>>;
     serializationType: ZodDefault<ZodOptional<...>>;
     useForJavaScript: ZodDefault<ZodOptional<...>>;
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
     dependencies: ...[];
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
     dependencies: ZodDefault<ZodOptional<...>>;
     id: ZodDefault<ZodOptional<...>>;
     language: ZodDefault<ZodOptional<...>>;
     outputPath: ZodDefault<ZodString>;
     preset: ZodDefault<ZodLiteral<...>>;
     serializationType: ZodDefault<ZodOptional<...>>;
    }, "strip", ZodTypeAny, {
     dependencies: string[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "parameters";
     serializationType: "json";
    }, {
     dependencies: ...[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "parameters";
     serializationType: "json";
    }>, ZodObject<{
     dependencies: ZodDefault<ZodOptional<...>>;
     id: ZodDefault<ZodOptional<...>>;
     language: ZodDefault<ZodOptional<...>>;
     outputPath: ZodDefault<ZodString>;
     parameterGeneratorId: ZodDefault<ZodOptional<...>>;
     payloadGeneratorId: ZodDefault<ZodOptional<...>>;
     preset: ZodDefault<ZodLiteral<...>>;
     protocols: ZodDefault<ZodArray<..., ...>>;
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
     dependencies: ...[];
     id: string;
     language: "typescript";
     outputPath: string;
     parameterGeneratorId: string;
     payloadGeneratorId: string;
     preset: "channels";
     protocols: ...[];
    }>, ZodObject<{
     channelsGeneratorId: ZodDefault<ZodOptional<...>>;
     dependencies: ZodDefault<ZodOptional<...>>;
     id: ZodDefault<ZodOptional<...>>;
     language: ZodDefault<ZodOptional<...>>;
     outputPath: ZodDefault<ZodString>;
     preset: ZodDefault<ZodLiteral<...>>;
     protocols: ZodDefault<ZodArray<..., ...>>;
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
     dependencies: ...[];
     id: string;
     language: "typescript";
     outputPath: string;
     preset: "client";
     protocols: ...[];
    }>, ZodObject<{
     dependencies: ZodOptional<ZodArray<..., ...>>;
     id: ZodOptional<ZodString>;
     options: ZodOptional<ZodAny>;
     preset: ZodLiteral<"custom">;
     renderFunction: ZodFunction<ZodTuple<..., ...>, ZodAny>;
    }, "strip", ZodTypeAny, {
     dependencies: ...[];
     id: string;
     options: any;
     preset: "custom";
     renderFunction: (...args) => any;
    }, {
     dependencies: ...[];
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
}>]>;
```

## Defined in

[src/codegen/types.ts:87](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L87)
