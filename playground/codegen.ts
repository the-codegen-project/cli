import { TheCodegenConfiguration } from "@the-codegen-project/cli";
const config: TheCodegenConfiguration = {
  inputType: "asyncapi",
  inputPath: "./schema.json",
  language: "typescript",
  generators: [
    {
      preset: "channels",
      outputPath: "./__gen__/channels",
      protocols: ["nats"],
    },
    {
      preset: "payloads",
      outputPath: "./__gen__/payloads",
      serializationType: "json",
      model: "class",
      enum: "enum",
      map: "record",
      moduleSystem: "esm",
      useForJavaScript: true,
      rawPropertyNames: false,
    },
    {
      preset: "parameters",
      outputPath: "./__gen__/parameters",
      serializationType: "json",
    },
  ],
};
export default config;
