export default {
  inputType: 'asyncapi',
  inputPath: './ecommerce-event-channels.yaml',
  generators: [
    {
      preset: 'client',
      outputPath: './src/generated',
      language: 'typescript',
      protocols: ['nats']
    }
  ]
}; 