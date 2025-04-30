[**@the-codegen-project/cli**](../API.md) • **Docs**

***

[Home](../API.md) / zodAsyncAPIGenerators

# Variable: zodAsyncAPIGenerators

```ts
const zodAsyncAPIGenerators: ZodUnion<[ZodObject<{
  dependencies: ZodDefault<ZodOptional<ZodArray<ZodString, "many">>>;
  enum: ZodDefault<ZodOptional<ZodEnum<["enum", "union"]>>>;
  id: ZodDefault<ZodOptional<ZodString>>;
  language: ZodDefault<ZodOptional<ZodLiteral<"typescript">>>;
  map: ZodDefault<ZodOptional<ZodEnum<["indexedObject", "map", "record"]>>>;
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
  protocols: ZodDefault<ZodArray<ZodEnum<["nats"]>, "many">>;
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
  protocols: ZodDefault<ZodArray<ZodEnum<["nats"]>, "many">>;
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
  renderFunction: ZodFunction<ZodTuple<[ZodOptional<ZodObject<{
     generator: ZodAny;
     inputType: ZodEnum<...>;
     options: ZodAny;
    }, "strip", ZodTypeAny, {
     generator: any;
     inputType: "asyncapi";
     options: any;
    }, {
     generator: any;
     inputType: "asyncapi";
     options: any;
    }>>, ZodOptional<ZodAny>], ZodUnknown>, ZodAny>;
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
}>]>;
```

## Defined in

[src/codegen/types.ts:42](https://github.com/the-codegen-project/cli/blob/main/src/codegen/types.ts#L42)
