
const t = {
  inputType: 'asyncapi',
  inputPath: './non-existent-schema.yml',
  generators: [
    {
      preset: 'invalid-preset-that-does-not-exist',
      outputPath: './output'
    }
  ]
};
