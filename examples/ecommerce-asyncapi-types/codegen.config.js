export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-channels.yaml',
  generators: [
    {
      preset: 'types',
      outputPath: './src/generated/types',
      language: 'typescript',
    }
  ]
}; 