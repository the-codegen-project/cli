/** @type {import("@the-codegen-project/cli").TheCodegenConfiguration} **/
export default {
  inputType: "asyncapi",
  inputPath: "asyncapi.json",
  language: "typescript",
  generators: [
    {
      preset: "payloads",
      outputPath: "src/__gen__/payloads",
      serializationType: "json"
    }
  ]
};
