export default {
  inputType: 'jsonschema',
  inputPath: './schema.json', // Will be replaced during tests
  language: 'typescript',
  generators: [
    {
      preset: 'models',
      outputPath: './src/models',
      options: {
        modelType: 'interface',
        enumType: 'union'
      }
    }
  ]
};
