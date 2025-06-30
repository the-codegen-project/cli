export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-messaging-system.yaml',
  generators: [
    {
      preset: 'parameters',
      outputPath: './src/generated/parameters',
      language: 'typescript',
    }
  ]
}; 